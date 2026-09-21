import { Peer, type DataConnection } from 'peerjs';

export type PartyAction = 'PLAY' | 'PAUSE' | 'SEEK' | 'EPISODE_CHANGE';

export interface SyncPayload {
  action: PartyAction;
  currentTime: number;
  season?: number;
  episode?: number;
  mediaId?: number;
  mediaType?: 'movie' | 'tv';
}

export interface PartyMessage {
  type: 'SYNC' | 'REACTION' | 'MEMBER_JOIN' | 'CHAT';
  sender: string;
  payload: any;
  timestamp: number;
}

export interface FloatingReaction {
  id: string;
  emoji: string;
  xPercent: number;
}

export interface WatchPartyState {
  isHost: boolean;
  roomId: string | null;
  isConnected: boolean;
  memberCount: number;
  peers: string[];
}

type MessageCallback = (msg: PartyMessage) => void;
type StateCallback = (state: WatchPartyState) => void;

class WatchPartyManager {
  private peer: Peer | null = null;
  private connections: Map<string, DataConnection> = new Map();
  private isHost: boolean = false;
  private roomId: string | null = null;
  private messageListeners: Set<MessageCallback> = new Set();
  private stateListeners: Set<StateCallback> = new Set();
  private userName: string = `Watcher-${Math.floor(Math.random() * 900 + 100)}`;

  public getState(): WatchPartyState {
    return {
      isHost: this.isHost,
      roomId: this.roomId,
      isConnected: this.connections.size > 0 || (this.isHost && !!this.peer),
      memberCount: this.connections.size + 1,
      peers: Array.from(this.connections.keys()),
    };
  }

  public subscribe(onMessage: MessageCallback, onState: StateCallback) {
    this.messageListeners.add(onMessage);
    this.stateListeners.add(onState);
    onState(this.getState());
    return () => {
      this.messageListeners.delete(onMessage);
      this.stateListeners.delete(onState);
    };
  }

  private notifyState() {
    const s = this.getState();
    this.stateListeners.forEach(cb => cb(s));
  }

  private notifyMessage(msg: PartyMessage) {
    this.messageListeners.forEach(cb => cb(msg));
  }

  /**
   * Host starts a new Watch Party room
   */
  public async createRoom(): Promise<string> {
    this.leaveRoom();
    this.isHost = true;

    return new Promise((resolve, reject) => {
      const generatedId = `lumia-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
      
      const peer = new Peer(generatedId, {
        debug: 1,
      });

      peer.on('open', (id) => {
        this.peer = peer;
        this.roomId = id;
        this.notifyState();
        resolve(id);
      });

      peer.on('connection', (conn) => {
        this.setupConnection(conn);
      });

      peer.on('error', (err) => {
        console.warn('Peer error during create:', err);
        // Fallback with auto-generated ID if collision
        if (!this.peer) {
          const fallbackPeer = new Peer({ debug: 1 });
          fallbackPeer.on('open', (id) => {
            this.peer = fallbackPeer;
            this.roomId = id;
            this.notifyState();
            resolve(id);
          });
          fallbackPeer.on('connection', c => this.setupConnection(c));
        } else {
          reject(err);
        }
      });
    });
  }

  /**
   * Guest joins an existing Watch Party room
   */
  public async joinRoom(targetRoomId: string): Promise<boolean> {
    this.leaveRoom();
    this.isHost = false;

    const cleanRoomId = targetRoomId.trim().toUpperCase();

    return new Promise((resolve, reject) => {
      const peer = new Peer({ debug: 1 });

      peer.on('open', () => {
        this.peer = peer;
        const conn = peer.connect(cleanRoomId, { reliable: true });

        conn.on('open', () => {
          this.roomId = cleanRoomId;
          this.connections.set(cleanRoomId, conn);
          this.setupConnection(conn);
          this.notifyState();

          // Send hello greeting
          this.sendTo(conn, {
            type: 'MEMBER_JOIN',
            sender: this.userName,
            payload: { name: this.userName },
            timestamp: Date.now(),
          });

          resolve(true);
        });

        conn.on('error', (err) => {
          console.warn('Connection failed to host:', err);
          reject(err);
        });
      });

      peer.on('error', (err) => {
        console.warn('Peer failed to initialize:', err);
        reject(err);
      });
    });
  }

  private setupConnection(conn: DataConnection) {
    this.connections.set(conn.peer, conn);
    this.notifyState();

    conn.on('data', (data: any) => {
      try {
        const msg = data as PartyMessage;
        this.notifyMessage(msg);

        // If host, rebroadcast to all other connected peers (Star topology)
        if (this.isHost) {
          this.connections.forEach((otherConn, peerId) => {
            if (peerId !== conn.peer && otherConn.open) {
              otherConn.send(msg);
            }
          });
        }
      } catch (e) {
        console.warn('Malformed watch party packet:', e);
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
  }

  private sendTo(conn: DataConnection, msg: PartyMessage) {
    if (conn.open) {
      conn.send(msg);
    }
  }

  /**
   * Broadcast sync state (Play, Pause, Seek, Episode transition) to all connected party members
   */
  public broadcastSync(payload: SyncPayload) {
    const msg: PartyMessage = {
      type: 'SYNC',
      sender: this.userName,
      payload,
      timestamp: Date.now(),
    };

    this.connections.forEach(conn => {
      if (conn.open) {
        conn.send(msg);
      }
    });
  }

  /**
   * Broadcast floating emoji reaction (🔥, 🍿, 😱, ❤️, 😂)
   */
  public broadcastReaction(emoji: string) {
    const msg: PartyMessage = {
      type: 'REACTION',
      sender: this.userName,
      payload: { emoji },
      timestamp: Date.now(),
    };

    // Trigger locally
    this.notifyMessage(msg);

    // Send to all peers
    this.connections.forEach(conn => {
      if (conn.open) {
        conn.send(msg);
      }
    });
  }

  /**
   * Disconnect and close the party
   */
  public leaveRoom() {
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

export const watchPartyManager = new WatchPartyManager();
