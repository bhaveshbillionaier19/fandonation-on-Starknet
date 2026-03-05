"use client";

import React, { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { uploadToIPFS } from "@/lib/ipfs";
import { useStarkNet } from "@/app/providers";
import { contractAddress, contractAbi } from "@/constants";
import { Contract, cairo, byteArray, CallData } from "starknet";
import { Loader2, Upload, Sparkles, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import Confetti from "react-confetti";

export default function MintPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [txHash, setTxHash] = useState<string | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const { toast } = useToast();
  const { account, isConnected } = useStarkNet();

  const handleFileChange = (files: FileList | null) => {
    if (files && files[0]) {
      const selectedFile = files[0];
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const onDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOver(false);
    const files = event.dataTransfer.files;
    handleFileChange(files);
  }, []);

  const handleMint = async () => {
    if (!file || !name || !description) {
      toast({
        title: "Error",
        description: "Please fill in all fields and select an image.",
        variant: "destructive",
      });
      return;
    }

    if (!isConnected || !account) {
      toast({
        title: "Error",
        description: "Please connect your wallet first.",
        variant: "destructive",
      });
      return;
    }

    if (!contractAddress) {
      toast({
        title: "Error",
        description: "Contract address is not defined in environment variables.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);
    setIsConfirmed(false);
    setTxHash(null);

    try {
      // Upload to IPFS
      const tokenURI = await uploadToIPFS(file, name, description);
      if (!tokenURI) {
        throw new Error("Failed to upload to IPFS");
      }

      // Call mint_nft on the StarkNet contract
      const contract = new Contract({ abi: contractAbi as any, address: contractAddress, providerOrAccount: account });
      const result = await contract.mint_nft(tokenURI);
      
      setTxHash(result.transaction_hash);
      
      // Wait for confirmation
      await account.waitForTransaction(result.transaction_hash);
      
      setIsConfirmed(true);
      toast({
        title: "🎉 NFT Minted Successfully!",
        description: `Transaction: ${result.transaction_hash.slice(0, 10)}...${result.transaction_hash.slice(-8)}`,
      });
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
      setFile(null);
      setPreviewUrl(null);
      setName("");
      setDescription("");
    } catch (error: any) {
      console.error(error);
      toast({
        title: "Minting Failed",
        description: error?.message || String(error),
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {showConfetti && <Confetti />}
      <div className="flex justify-center items-center min-h-[calc(100vh-80px)] p-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-lg"
        >
          <Card className="glass-card glow-border border-white/[0.06] overflow-hidden">
            <CardHeader className="text-center pb-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-cyan-500 flex items-center justify-center mx-auto mb-4 shadow-lg shadow-purple-500/20"
              >
                <Sparkles className="w-7 h-7 text-white" />
              </motion.div>
              <CardTitle className="text-2xl font-bold">Create Your NFT</CardTitle>
              <CardDescription className="text-muted-foreground">
                Upload your artwork and mint it as a unique NFT on StarkNet.
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-5 pt-4">
              {/* Drag & Drop Zone */}
              <motion.div 
                className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
                  isDragOver
                    ? "border-purple-500/60 bg-purple-500/10 scale-[1.02]"
                    : previewUrl
                    ? "border-purple-500/30 bg-purple-500/5"
                    : "border-white/10 hover:border-white/20 hover:bg-white/[0.02]"
                }`}
                onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
                onDragLeave={() => setIsDragOver(false)}
                onDrop={onDrop}
                onClick={() => document.getElementById('file-upload')?.click()}
                whileHover={{ scale: previewUrl ? 1 : 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <input type="file" id="file-upload" className="hidden" accept="image/*" onChange={(e) => handleFileChange(e.target.files)} />
                {previewUrl ? (
                  <div className="relative w-full h-64">
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      fill
                      className="rounded-xl object-contain"
                      unoptimized
                    />
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-t from-black/20 to-transparent" />
                    <div className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs text-white/70 bg-black/30 backdrop-blur-sm rounded-full px-3 py-1">
                      Click to change
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-3 py-4">
                    <div className="w-14 h-14 rounded-2xl bg-white/[0.05] flex items-center justify-center">
                      <ImageIcon className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">Drop your image here</p>
                      <p className="text-xs text-muted-foreground mt-1">or click to browse files</p>
                    </div>
                    <div className="flex gap-2 text-[10px] text-muted-foreground/60">
                      <span>PNG</span>
                      <span>•</span>
                      <span>JPG</span>
                      <span>•</span>
                      <span>GIF</span>
                      <span>•</span>
                      <span>SVG</span>
                    </div>
                  </div>
                )}
              </motion.div>

              {/* Name Input */}
              <div className="space-y-2">
                <label htmlFor="name" className="text-sm font-medium">Name</label>
                <Input
                  id="name"
                  placeholder='e.g. "Sunset Over the Mountains"'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isProcessing}
                  className="bg-white/5 border-white/10 focus:border-purple-500/50 focus:ring-purple-500/20"
                />
              </div>

              {/* Description Input */}
              <div className="space-y-2">
                <label htmlFor="description" className="text-sm font-medium">Description</label>
                <Textarea
                  id="description"
                  placeholder="Describe your artwork..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={isProcessing}
                  className="bg-white/5 border-white/10 focus:border-purple-500/50 focus:ring-purple-500/20 min-h-[80px]"
                />
              </div>

              {/* Mint Button */}
              <button
                onClick={handleMint}
                disabled={isProcessing}
                className="w-full gradient-btn text-white font-semibold py-3 rounded-xl inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-base"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {txHash ? "Minting..." : "Confirm in wallet..."}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Mint NFT
                  </>
                )}
              </button>

              {/* Transaction Status */}
              {isConfirmed && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-sm text-green-400 bg-green-500/10 rounded-xl px-4 py-3"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>NFT minted successfully!</span>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </>
  );
}
