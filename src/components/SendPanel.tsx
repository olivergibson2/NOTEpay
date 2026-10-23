import { useState, useCallback } from 'react';
import { useAccount, useWriteContract, useWaitForTransactionReceipt, useSwitchChain, useReadContract } from 'wagmi';
import { erc20Abi, isAddress } from 'viem';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowUpRight, ExternalLink, CheckCircle2, AlertCircle, X } from 'lucide-react';
import { TokenUSDC } from '@web3icons/react';
import { getUsdc, buildTxExplorerUrl, requireChain } from '@/onchain-facts';
import { parseAmount, Amount, usdcDecimalsFor } from '@/onchain-money';

const QUICK_AMOUNTS = ['1', '5', '10', '25'];

function parseOnchainError(error: unknown): string {
  const msg = (error as { message?: string })?.message?.toLowerCase() ?? '';
  if (msg.includes('user rejected') || (error as { code?: number })?.code === 4001) return 'Transaction cancelled.';
  if (msg.includes('insufficient funds') || msg.includes('exceeds balance')) return 'Insufficient balance.';
  if (msg.includes('reverted')) return 'Transaction failed. Please try again.';
  if (msg.includes('network') || msg.includes('timeout')) return 'Network error. Please retry.';
  return 'Something went wrong. Please try again.';
}

interface SendPanelProps {
  chainId: number;
}

export function SendPanel({ chainId }: SendPanelProps) {
  const { address, chainId: walletChainId, isConnected } = useAccount();
  const { switchChain, isPending: isSwitching } = useSwitchChain();
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');

  const usdc = getUsdc(chainId)!;
  const chainName = requireChain(chainId).name;

  const { data: rawBalance } = useReadContract({
    address: usdc.address as `0x${string}`,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId,
    query: { enabled: !!address },
  });

  const formattedBalance = rawBalance != null
    ? Amount.fromRaw(rawBalance, usdcDecimalsFor(chainId)).toFixed(2)
    : null;

  const { writeContract, data: txHash, isPending, error: writeError, reset } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash: txHash });

  const isWrongChain = isConnected && walletChainId !== chainId;
  const recipientValid = isAddress(recipient);
  const amountValid = amount !== '' && parseFloat(amount) > 0;
  const canSend = isConnected && !isWrongChain && recipientValid && amountValid && !isPending && !isConfirming;

  const handleSend = useCallback(() => {
    if (isWrongChain) { switchChain({ chainId: chainId }); return; }
    if (!recipientValid || !amountValid) return;
    const parsed = parseAmount(chainId, amount);
    writeContract({
      address: usdc.address as `0x${string}`,
      abi: erc20Abi,
      functionName: 'transfer',
      args: [recipient, parsed.raw],
      chainId: chainId,
    });
  }, [isWrongChain, switchChain, chainId, recipientValid, amountValid, amount, recipient, usdc.address, writeContract]);

  const txUrl = txHash ? buildTxExplorerUrl(chainId, txHash) : null;

  const handleReset = () => {
    reset();
    setAmount('');
    setMemo('');
    setRecipient('');
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Balance bar */}
      <div
        className="flex items-center justify-between rounded-2xl px-4 py-3"
        style={{ background: 'var(--surface-muted)', border: '1px solid var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <TokenUSDC variant="branded" size={20} />
          <span className="text-sm font-medium" style={{ color: 'var(--muted)' }}>Balance</span>
        </div>
        <span className="display text-sm font-bold tabular-nums" style={{ color: 'var(--ink)' }}>
          {formattedBalance != null ? `${formattedBalance} USDC` : isConnected ? '...' : '—'}
        </span>
      </div>

      {/* Recipient */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
          To
        </label>
        <div
          className="flex items-center gap-2 rounded-2xl px-4 py-3"
          style={{
            background: 'var(--surface-strong)',
            border: `1px solid ${recipient && !recipientValid ? 'var(--danger)' : 'var(--border)'}`,
            backdropFilter: 'blur(20px)',
          }}
        >
          <input
            value={recipient}
            onChange={(e) => setRecipient(e.target.value.trim())}
            placeholder="0x... wallet address"
            className="mono flex-1 bg-transparent text-sm outline-none placeholder:text-slate-400"
            style={{ color: 'var(--ink)' }}
          />
          {recipient && (
            <button onClick={() => setRecipient('')} style={{ color: 'var(--subtle)' }}>
              <X className="size-3.5" />
            </button>
          )}
        </div>
        {recipient && !recipientValid && (
          <p className="text-xs" style={{ color: 'var(--danger)' }}>Enter a valid wallet address.</p>
        )}
      </div>

      {/* Amount */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
          Amount
        </label>
        <div
          className="rounded-2xl px-4 py-3"
          style={{ background: 'var(--surface-strong)', border: '1px solid var(--border)', backdropFilter: 'blur(20px)' }}
        >
          <div className="flex items-center gap-2">
            <span className="text-base font-medium" style={{ color: 'var(--subtle)' }}>$</span>
            <input
              inputMode="decimal"
              value={amount}
              onChange={(e) => {
                const v = e.target.value.replace(/[^0-9.]/g, '');
                if (v === '' || /^\d*\.?\d*$/.test(v)) setAmount(v);
              }}
              placeholder="0.00"
              className="display flex-1 bg-transparent text-3xl font-bold tabular-nums outline-none placeholder:text-slate-300"
              style={{ color: 'var(--ink)' }}
            />
            <span className="text-sm font-semibold" style={{ color: 'var(--subtle)' }}>USDC</span>
          </div>
          <div className="mt-2">
            <button
              disabled={!formattedBalance}
              onClick={() => { if (formattedBalance) setAmount(formattedBalance); }}
              className="text-xs font-semibold disabled:opacity-40"
              style={{ color: 'var(--accent-hover)' }}
            >
              Max
            </button>
          </div>
        </div>
        {/* Quick chips */}
        <div className="flex gap-2">
          {QUICK_AMOUNTS.map((q) => (
            <button
              key={q}
              onClick={() => setAmount(q)}
              className="rounded-xl px-3 py-1.5 text-xs font-semibold transition-all hover:scale-105 active:scale-95"
              style={{
                background: amount === q ? 'var(--accent)' : 'var(--surface-muted)',
                color: amount === q ? '#fff' : 'var(--ink-2)',
                border: '1px solid var(--border)',
              }}
            >
              ${q}
            </button>
          ))}
        </div>
      </div>

      {/* Memo (optional) */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
          Note <span className="normal-case font-normal">(optional)</span>
        </label>
        <input
          value={memo}
          onChange={(e) => setMemo(e.target.value)}
          placeholder="Coffee, lunch, etc."
          maxLength={100}
          className="rounded-2xl px-4 py-3 text-sm outline-none placeholder:text-slate-400"
          style={{
            background: 'var(--surface-strong)',
            border: '1px solid var(--border)',
            color: 'var(--ink)',
            backdropFilter: 'blur(20px)',
          }}
        />
      </div>

      {/* CTA */}
      <button
        disabled={isConnected ? (!isWrongChain && !canSend) || isSwitching : false}
        onClick={handleSend}
        className="w-full rounded-2xl py-4 text-sm font-semibold text-white transition-all hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40"
        style={{ background: 'var(--accent)' }}
      >
        {!isConnected
          ? 'Connect wallet to send'
          : isWrongChain
          ? isSwitching
            ? <span className="flex items-center justify-center gap-2"><Loader2 className="size-4 animate-spin" /> Switching...</span>
            : `Switch to ${chainName}`
          : isPending
          ? <span className="flex items-center justify-center gap-2"><Loader2 className="size-4 animate-spin" /> Confirm in wallet...</span>
          : isConfirming
          ? <span className="flex items-center justify-center gap-2"><Loader2 className="size-4 animate-spin" /> Confirming...</span>
          : <span className="flex items-center justify-center gap-2"><ArrowUpRight className="size-4" /> Send USDC</span>}
      </button>

      {/* Write error */}
      <AnimatePresence>
        {writeError && (
          <motion.div
            initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            className="flex items-start gap-2 rounded-2xl p-3"
            style={{ background: 'rgba(186,43,76,0.07)', border: '1px solid rgba(186,43,76,0.2)' }}
          >
            <AlertCircle className="mt-0.5 size-4 shrink-0" style={{ color: 'var(--danger)' }} />
            <p className="text-sm" style={{ color: 'var(--danger)' }}>{parseOnchainError(writeError)}</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success receipt */}
      <AnimatePresence>
        {isSuccess && txUrl && (
          <motion.div
            initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
            className="flex flex-col gap-2 rounded-2xl p-4"
            style={{ background: 'rgba(26,128,71,0.07)', border: '1px solid rgba(26,128,71,0.2)' }}
          >
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-4" style={{ color: 'var(--success)' }} />
              <span className="text-sm font-semibold" style={{ color: 'var(--success)' }}>Payment sent!</span>
            </div>
            <a href={txUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-xs font-medium" style={{ color: 'var(--accent-hover)' }}>
              View on ArcScan <ExternalLink className="size-3" />
            </a>
            <button onClick={handleReset} className="mt-1 text-xs font-semibold underline" style={{ color: 'var(--muted)' }}>
              Send another
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
