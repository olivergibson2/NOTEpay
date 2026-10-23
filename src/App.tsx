import { useState } from 'react';
import { useAccount, useReadContract } from 'wagmi';
import { ConnectKitButton } from 'connectkit';
import { erc20Abi } from 'viem';
import { motion } from 'framer-motion';
import { TokenUSDC } from '@web3icons/react';
import { SendPanel } from './components/SendPanel';
import { HistoryPanel } from './components/HistoryPanel';
import { getUsdc } from '@/onchain-facts';
import { Amount, usdcDecimalsFor } from '@/onchain-money';

const CHAIN_ID = 5042; // Arc Mainnet

type Tab = 'send' | 'history';

const TABS: { id: Tab; label: string }[] = [
  { id: 'send', label: 'Send' },
  { id: 'history', label: 'History' },
];

const SPECTRAL = 'linear-gradient(90deg, #6ee7f7 0%, #a78bfa 35%, #f472b6 65%, #fbbf24 100%)';

export default function App() {
  const { address, isConnected } = useAccount();
  const [activeTab, setActiveTab] = useState<Tab>('send');

  const usdc = getUsdc(CHAIN_ID)!;

  const { data: rawBalance } = useReadContract({
    address: usdc.address as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: CHAIN_ID,
    query: { enabled: !!address },
  });

  const formattedBalance = rawBalance != null
    ? Amount.fromRaw(rawBalance, usdcDecimalsFor(CHAIN_ID)).toFixed(2)
    : null;

  return (
    <div className="min-h-dvh" style={{ background: 'var(--bg-gradient)' }}>
      <div className="mx-auto max-w-md px-4 py-8 pb-16">

        {/* Tagline */}
        <p
          className="display mb-1 text-center text-xs font-semibold uppercase tracking-widest"
          style={{ color: 'var(--muted)', letterSpacing: '0.12em' }}
        >
          Never forget what you paid for
        </p>
        <p
          className="mb-4 text-center text-xs"
          style={{ color: 'var(--subtle)' }}
        >
          Add a note to every transaction so you'll never forget what you paid for
        </p>

        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TokenUSDC variant="branded" size={28} />
            <span className="display text-xl font-bold" style={{ color: 'var(--ink)', letterSpacing: '-0.03em' }}>
              Pay
            </span>
          </div>
          <ConnectKitButton />
        </div>

        {/* Hero balance card */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
          className="mb-4 overflow-hidden rounded-3xl"
          style={{
            background: 'rgba(255,255,255,0.82)',
            backdropFilter: 'blur(32px) saturate(180%)',
            WebkitBackdropFilter: 'blur(32px) saturate(180%)',
            border: '1px solid var(--border)',
            boxShadow: '0 2px 24px rgba(18,45,69,0.07)',
          }}
        >
          <div className="h-1" style={{ background: SPECTRAL }} />
          <div className="px-5 py-5">
            <div className="mb-1 flex items-center gap-1.5">
              <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
                USDC Balance
              </span>
              <span
                className="rounded-full px-1.5 py-0.5 text-[10px] font-bold uppercase"
                style={{ background: 'rgba(16,97,166,0.10)', color: 'var(--accent-hover)' }}
              >
                Arc Mainnet
              </span>
            </div>

            <div className="flex items-baseline gap-1.5">
              <span
                className="display text-5xl font-bold tabular-nums"
                style={{ color: 'var(--ink)', letterSpacing: '-0.04em' }}
              >
                {formattedBalance != null ? formattedBalance : isConnected ? '...' : '—'}
              </span>
              <span className="text-xl font-semibold" style={{ color: 'var(--subtle)' }}>USDC</span>
            </div>

            <p className="mt-1.5 text-xs" style={{ color: 'var(--subtle)' }}>
              {isConnected
                ? `${address?.slice(0, 8)}…${address?.slice(-6)}`
                : 'Connect wallet to view balance'}
            </p>
          </div>
        </motion.section>

        {/* Tab card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08, ease: [0.22, 1, 0.36, 1] }}
          className="overflow-hidden rounded-3xl"
          style={{
            background: 'rgba(255,255,255,0.82)',
            backdropFilter: 'blur(32px) saturate(180%)',
            WebkitBackdropFilter: 'blur(32px) saturate(180%)',
            border: '1px solid var(--border)',
            boxShadow: '0 2px 24px rgba(18,45,69,0.07)',
          }}
        >
          {/* Tab bar */}
          <div
            className="flex border-b"
            style={{ borderColor: 'var(--border)', background: 'var(--surface-muted)' }}
          >
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="relative flex-1 py-3.5 text-sm font-semibold transition-colors"
                style={{ color: activeTab === tab.id ? 'var(--ink)' : 'var(--subtle)' }}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="tab-indicator"
                    className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full"
                    style={{ background: 'var(--accent)' }}
                    transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                  />
                )}
              </button>
            ))}
          </div>

          {/* Panel */}
          <div className="p-5">
            {activeTab === 'send' && <SendPanel chainId={CHAIN_ID} />}
            {activeTab === 'history' && <HistoryPanel chainId={CHAIN_ID} />}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
