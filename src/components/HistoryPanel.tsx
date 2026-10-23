import { useAccount, usePublicClient } from 'wagmi';
import { useEffect, useState } from 'react';
import { parseAbiItem } from 'viem';
import { motion } from 'framer-motion';
import { ArrowUpRight, ArrowDownLeft, ExternalLink, RefreshCw } from 'lucide-react';
import { getUsdc, buildTxExplorerUrl } from '@/onchain-facts';
import { Amount, usdcDecimalsFor } from '@/onchain-money';

const LOOKBACK_BLOCKS = 5000n;

interface TxEntry {
  hash: string;
  direction: 'sent' | 'received';
  counterpart: string;
  amount: string;
  blockNumber: bigint;
}

function shortAddr(addr: string) {
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

interface HistoryPanelProps {
  chainId: number;
}

export function HistoryPanel({ chainId }: HistoryPanelProps) {
  const { address, isConnected } = useAccount();
  const client = usePublicClient({ chainId });
  const [entries, setEntries] = useState<TxEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const usdc = getUsdc(chainId)!;

  const load = async () => {
    if (!address || !client) return;
    setLoading(true);
    setError('');
    try {
      const head = await client.getBlockNumber();
      const fromBlock = head > LOOKBACK_BLOCKS ? head - LOOKBACK_BLOCKS : 0n;

      const [sentLogs, receivedLogs] = await Promise.all([
        client.getLogs({
          address: usdc.address as `0x${string}`,
          event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
          args: { from: address },
          fromBlock,
          toBlock: head,
        }),
        client.getLogs({
          address: usdc.address as `0x${string}`,
          event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 value)'),
          args: { to: address },
          fromBlock,
          toBlock: head,
        }),
      ]);

      const decimals = usdcDecimalsFor(chainId);

      const combined: TxEntry[] = [
        ...sentLogs.map((log) => ({
          hash: log.transactionHash ?? '',
          direction: 'sent' as const,
          counterpart: log.args.to as string,
          amount: Amount.fromRaw(log.args.value ?? 0n, decimals).toFixed(2),
          blockNumber: log.blockNumber ?? 0n,
        })),
        ...receivedLogs.map((log) => ({
          hash: log.transactionHash ?? '',
          direction: 'received' as const,
          counterpart: log.args.from as string,
          amount: Amount.fromRaw(log.args.value ?? 0n, decimals).toFixed(2),
          blockNumber: log.blockNumber ?? 0n,
        })),
      ].sort((a, b) => (a.blockNumber > b.blockNumber ? -1 : 1));

      setEntries(combined.slice(0, 30));
    } catch {
      setError('Could not load history. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // Reload whenever chain or address changes
  useEffect(() => {
    setEntries([]);
    if (isConnected && address) { void load(); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [address, isConnected, chainId]);

  if (!isConnected) {
    return (
      <p className="text-center text-sm py-8" style={{ color: 'var(--subtle)' }}>
        Connect your wallet to view transaction history.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
          Recent (last {Number(LOOKBACK_BLOCKS).toLocaleString()} blocks)
        </p>
        <button
          onClick={() => { void load(); }}
          disabled={loading}
          className="flex items-center gap-1 text-xs font-semibold disabled:opacity-40"
          style={{ color: 'var(--accent-hover)' }}
        >
          <RefreshCw className={`size-3 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {error && (
        <p className="text-xs text-center py-4" style={{ color: 'var(--danger)' }}>{error}</p>
      )}

      {!loading && !error && entries.length === 0 && (
        <p className="text-center text-sm py-8" style={{ color: 'var(--subtle)' }}>
          No USDC transfers found in recent blocks.
        </p>
      )}

      {entries.map((entry, i) => (
        <motion.div
          key={entry.hash + i}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.04 }}
          className="flex items-center gap-3 rounded-2xl px-4 py-3"
          style={{ background: 'var(--surface-strong)', border: '1px solid var(--border)' }}
        >
          <div
            className="flex size-9 shrink-0 items-center justify-center rounded-xl"
            style={{
              background: entry.direction === 'sent' ? 'rgba(186,43,76,0.08)' : 'rgba(26,128,71,0.08)',
            }}
          >
            {entry.direction === 'sent' ? (
              <ArrowUpRight className="size-4" style={{ color: 'var(--danger)' }} />
            ) : (
              <ArrowDownLeft className="size-4" style={{ color: 'var(--success)' }} />
            )}
          </div>

          <div className="flex flex-1 flex-col min-w-0">
            <span className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
              {entry.direction === 'sent' ? 'Sent' : 'Received'}
            </span>
            <span className="mono truncate text-xs" style={{ color: 'var(--subtle)' }}>
              {entry.direction === 'sent' ? 'To ' : 'From '}
              {shortAddr(entry.counterpart)}
            </span>
          </div>

          <div className="flex flex-col items-end gap-0.5">
            <span
              className="display text-sm font-bold tabular-nums"
              style={{ color: entry.direction === 'sent' ? 'var(--danger)' : 'var(--success)' }}
            >
              {entry.direction === 'sent' ? '−' : '+'}
              {entry.amount} USDC
            </span>
            {entry.hash && (
              <a
                href={buildTxExplorerUrl(chainId, entry.hash)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-0.5 text-xs"
                style={{ color: 'var(--subtle)' }}
              >
                Tx <ExternalLink className="size-2.5" />
              </a>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
}
