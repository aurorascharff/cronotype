import { randomBytes } from 'node:crypto';

export default function TestRandomPage() {
  return (
    <div>
      <h1>Test random</h1>
      <TokenDisplay />
    </div>
  );
}

async function TokenDisplay() {
  const buf = randomBytes(32);
  return <code>{buf.toString('hex')}</code>;
}
