"use client";

import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useStarkNet } from "@/app/providers";
import { contractAddress, contractAbi, strkAbi, STRK_TOKEN_ADDRESS, EXPLORER_URL } from "@/constants";
import Image from "next/image";
import { Contract, cairo } from "starknet";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import Confetti from 'react-confetti';
import { Loader2, Heart, Copy, Check } from "lucide-react";
import { motion } from "framer-motion";

import { type NftData } from "../app/page";

interface NFTCardProps {
  nft: NftData;
  index?: number;
  onDonation?: (payload: { donor: string; amount: bigint; tokenId: number }) => void;
  onTotalsChange?: () => void;
}

function formatStrk(amount: bigint): string {
  const whole = amount / 10n ** 18n;
  const frac = amount % 10n ** 18n;
  const fracStr = frac.toString().padStart(18, "0").slice(0, 4);
  return `${whole}.${fracStr}`;
}

export default function NFTCard({ nft, index = 0, onDonation, onTotalsChange }: NFTCardProps) {
  const { tokenId, metadata, owner, totalDonations } = nft;
  const [donationAmount, setDonationAmount] = useState("");
  const [showConfetti, setShowConfetti] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();
  const { account, isConnected, getProvider } = useStarkNet();

  const computedTotalDonations = totalDonations ?? 0n;

  const handleDonate = async () => {
    if (!donationAmount || parseFloat(donationAmount) <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid fan donation amount.", variant: "destructive" });
      return;
    }
    if (!isConnected || !account) {
      toast({ title: "Error", description: "Please connect your wallet first.", variant: "destructive" });
      return;
    }
    if (!contractAddress) {
      toast({ title: "Error", description: "Contract address is not configured.", variant: "destructive" });
      return;
    }

    setIsProcessing(true);
    try {
      // Convert amount to wei (18 decimals)
      const amountWei = BigInt(Math.floor(parseFloat(donationAmount) * 1e18));

      // Step 1: Approve STRK spending
      const strkContract = new Contract({ abi: strkAbi as any, address: STRK_TOKEN_ADDRESS, providerOrAccount: account });
      const approveTx = await strkContract.approve(
        contractAddress,
        cairo.uint256(amountWei)
      );
      await getProvider().waitForTransaction(approveTx.transaction_hash);

      // Step 2: Call donate
      const contract = new Contract({ abi: contractAbi as any, address: contractAddress, providerOrAccount: account });
      const donateTx = await contract.donate(
        cairo.uint256(tokenId),
        cairo.uint256(amountWei)
      );
      await getProvider().waitForTransaction(donateTx.transaction_hash);

      toast({
        title: "🎉 Fan Donation Successful!",
        description: "Thank you for your support!",
      });
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
      setDonationAmount("");

      if (onDonation) {
        onDonation({ donor: account.address, amount: amountWei, tokenId });
      }
      if (onTotalsChange) {
        onTotalsChange();
      }
    } catch (error: any) {
      console.error("Donate error:", error);
      toast({
        title: "Donation Failed",
        description: error?.message || "Transaction failed.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const shortenedAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  const handleCopyAddress = () => {
    if (owner) {
      navigator.clipboard.writeText(owner);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <>
      {showConfetti && <Confetti />}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: index * 0.08, ease: "easeOut" }}
      >
        <Card className="overflow-hidden glass-card glow-border-hover border-white/[0.06] transition-all duration-500 hover:scale-[1.02] group">
          <CardHeader className="p-0">
            <div className="relative w-full h-64 overflow-hidden">
              {metadata?.image ? (
                <Image
                  src={metadata.image}
                  alt={metadata.name || ''}
                  fill
                  className="object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
                />
              ) : (
                <div className="w-full h-full shimmer rounded-t-lg" />
              )}
              {/* Donation Badge */}
              <div className="absolute top-3 right-3 glow-badge rounded-full bg-purple-600/90 backdrop-blur-sm px-3 py-1 text-xs font-bold text-white">
                {formatStrk(computedTotalDonations)} STRK
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 space-y-2.5">
            <CardTitle className="text-base font-bold">{metadata?.name || `NFT #${tokenId}`}</CardTitle>
            <p className="text-sm text-muted-foreground truncate leading-relaxed">{metadata?.description}</p>
            {typeof owner === 'string' && (
              <div className="flex items-center gap-2">
                <p className="text-xs text-muted-foreground font-mono">
                  {shortenedAddress(owner)}
                </p>
                <button
                  onClick={handleCopyAddress}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title="Copy address"
                >
                  {copied ? (
                    <Check className="w-3 h-3 text-green-400" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                </button>
              </div>
            )}
          </CardContent>

          <CardFooter className="flex justify-between items-center p-4 border-t border-white/[0.06]">
            <div>
              <p className="text-sm font-bold gradient-text">{`${formatStrk(computedTotalDonations)} STRK`}</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Total Donations</p>
            </div>
            <Dialog>
              <DialogTrigger asChild>
                <button
                  disabled={isProcessing}
                  className="gradient-btn text-white text-sm font-semibold px-5 py-2 rounded-full inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Heart className="w-3.5 h-3.5" />
                  Donate
                </button>
              </DialogTrigger>
              <DialogContent className="glass-card border-white/10 sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-lg font-bold">
                    Donate to {metadata?.name || `NFT #${tokenId}`}
                  </DialogTitle>
                  <DialogDescription className="text-muted-foreground">
                    Your support helps the creator. Enter the amount of STRK you&apos;d like to donate.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 pt-2">
                  <div className="relative">
                    <Input 
                      type="number" 
                      placeholder="0.05" 
                      value={donationAmount} 
                      onChange={(e) => setDonationAmount(e.target.value)} 
                      disabled={isProcessing}
                      className="pr-14 bg-white/5 border-white/10 focus:border-purple-500/50 focus:ring-purple-500/20"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground font-semibold">
                      STRK
                    </span>
                  </div>
                  <button
                    onClick={handleDonate}
                    disabled={isProcessing}
                    className="w-full gradient-btn text-white font-semibold py-2.5 rounded-xl inline-flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Heart className="w-4 h-4" />
                        Confirm Fan Donation
                      </>
                    )}
                  </button>
                </div>
              </DialogContent>
            </Dialog>
          </CardFooter>
        </Card>
      </motion.div>
    </>
  );
}
