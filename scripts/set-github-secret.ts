import sodium from 'libsodium-wrappers';

async function setSecret(secretName: string, secretValue: string) {
  const proc = Bun.spawn(['bash', '-c', 'printf "protocol=https\\nhost=github.com\\n\\n" | git credential fill 2>/dev/null | grep "^password=" | cut -d= -f2']);
  const ghToken = (await new Response(proc.stdout).text()).trim();

  if (!ghToken) {
    console.error('❌ Could not retrieve GitHub token from keychain');
    process.exit(1);
  }

  const repo = 'hffgzktbcc-blip/vidlink-pro-4k';
  const pubKeyRes = await fetch(`https://api.github.com/repos/${repo}/actions/secrets/public-key`, {
    headers: {
      Authorization: `token ${ghToken}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!pubKeyRes.ok) {
    console.error('❌ Failed to fetch public key from GitHub:', await pubKeyRes.text());
    process.exit(1);
  }

  const { key_id, key } = await pubKeyRes.json();

  await sodium.ready;
  const messageBytes = Buffer.from(secretValue);
  const keyBytes = Buffer.from(key, 'base64');
  const encryptedBytes = sodium.crypto_box_seal(messageBytes, keyBytes);
  const encrypted_value = Buffer.from(encryptedBytes).toString('base64');

  const putRes = await fetch(`https://api.github.com/repos/${repo}/actions/secrets/${secretName}`, {
    method: 'PUT',
    headers: {
      Authorization: `token ${ghToken}`,
      Accept: 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      encrypted_value,
      key_id,
    }),
  });

  if (putRes.status === 201 || putRes.status === 204) {
    console.log(`✅ Successfully stored secret "${secretName}" in GitHub repository ${repo}!`);
  } else {
    console.error('❌ Failed to store secret:', await putRes.text());
    process.exit(1);
  }
}

const [secretName, secretValue] = process.argv.slice(2);
if (!secretName || !secretValue) {
  console.error('Usage: bun scripts/set-github-secret.ts <SECRET_NAME> <SECRET_VALUE>');
  process.exit(1);
}

setSecret(secretName, secretValue);
