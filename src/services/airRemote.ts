import { Peer, type DataConnection } from 'peerjs';

export type RemoteKeyAction =
  | 'ArrowUp'
  | 'ArrowDown'
  | 'ArrowLeft'
  | 'ArrowRight'
  | 'Enter'
  | 'Escape'
  | 'Backspace';

export type RemoteMediaAction =
  | 'PLAY_PAUSE'
  | 'SEEK_FWD'
  | 'SEEK_BACK'
  | 'VOLUME_UP'
  | 'VOLUME_DOWN'
  | 'FULLSCREEN'
  | 'PIP'
  | 'CLOSE_MODAL';

export interface RemoteCommandMessage {
  type: 'KEY' | 'SEARCH' | 'ACTION' | 'NAVIGATE' | 'SURPRISE_ME' | 'CURSOR_DELTA' | 'CURSOR_CLICK';
  key?: RemoteKeyAction;
  action?: RemoteMediaAction;
  text?: string;
  tab?: string;
  dx?: number;
  dy?: number;
  timestamp: number;
}

export interface RemoteHostState {
  isHost: boolean;
  roomId: string | null;
  isConnected: boolean;
  activeControllersCount: number;
}

type CommandCallback = (cmd: RemoteCommandMessage) => void;
type HostStateCallback = (state: RemoteHostState) => void;

class AirRemoteManager {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private isHost: boolean = false;
  private roomId: string | null = null;
  private commandListeners: Set<CommandCallback> = new Set();
  private stateListeners: Set<HostStateCallback> = new Set();

  public getState(): RemoteHostState {
    return {
      isHost: this.isHost,
      roomId: this.roomId,
      isConnected: this.connections.size > 0 || (this.isHost && !!this.peer),
      activeControllersCount: this.connections.size,
    };
  }

  public subscribe(onCommand: CommandCallback, onState: HostStateCallback) {
    this.commandListeners.add(onCommand);
    this.stateListeners.add(onState);
    onState(this.getState());
    return () => {
      this.commandListeners.delete(onCommand);
      this.stateListeners.delete(onState);
    };
  }

  private notifyState() {
    const s = this.getState();
    this.stateListeners.forEach(cb => cb(s));
  }

  private notifyCommand(cmd: RemoteCommandMessage) {
    this.commandListeners.forEach(cb => cb(cmd));
  }

  /**
   * TV starts hosting an Air Remote session
   */
  public async createHost(): Promise<string> {
    this.disconnect();
    this.isHost = true;

    return new Promise((resolve, reject) => {
      const generatedId = `lumia-air-${Math.random().toString(36).substring(2, 8).toLowerCase()}`;
      const peer = new Peer(generatedId, { debug: 1 });

      peer.on('open', id => {
        this.peer = peer;
        this.roomId = id;
        this.notifyState();
        resolve(id);
      });

      peer.on('connection', conn => {
        this.connections.set(conn.peer, conn);
        this.notifyState();

        conn.on('data', data => {
          try {
            this.notifyCommand(data as RemoteCommandMessage);
          } catch (e) {
            console.warn('Malformed remote command:', e);
          }
        });

        conn.on('close', () => {
          this.connections.delete(conn.peer);
          this.notifyState();
        });

        conn.on('error', () => {
          this.connections.delete(conn.peer);
          this.notifyState();
        });
      });

      peer.on('error', err => {
        console.warn('Peer error in AirRemote host:', err);
        reject(err);
      });
    });
  }

  /**
   * Mobile phone connects to TV host
   */
  public async connectAsRemote(hostRoomId: string): Promise<boolean> {
    this.disconnect();
    this.isHost = false;
    const cleanId = hostRoomId.trim().toLowerCase();

    return new Promise((resolve, reject) => {
      const peer = new Peer({ debug: 1 });

      peer.on('open', () => {
        this.peer = peer;
        const conn = peer.connect(cleanId, { reliable: true });

        conn.on('open', () => {
          this.roomId = cleanId;
          this.connections.set(cleanId, conn);
          this.notifyState();
          resolve(true);
        });

        conn.on('error', err => {
          console.warn('AirRemote failed to connect to TV:', err);
          reject(err);
        });
      });

      peer.on('error', err => {
        console.warn('AirRemote client peer error:', err);
        reject(err);
      });
    });
  }

  /**
   * Phone sends a command to the TV host
   */
  public sendCommand(cmd: Omit<RemoteCommandMessage, 'timestamp'>) {
    const packet: RemoteCommandMessage = {
      ...cmd,
      timestamp: Date.now(),
    };

    this.connections.forEach(conn => {
      if (conn.open) {
        conn.send(packet);
      }
    });
  }

  public disconnect() {
    this.connections.forEach(c => {
      try { c.close(); } catch {}
    });
    this.connections.clear();

    if (this.peer) {
      try { this.peer.destroy(); } catch {}
      this.peer = null;
    }

    this.roomId = null;
    this.isHost = false;
    this.notifyState();
  }
}

export const airRemoteManager = new AirRemoteManager();
