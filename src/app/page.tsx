"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useStarkNet } from "@/app/providers";
import { contractAddress, contractAbi, RPC_URL } from "@/constants";
import { Contract, RpcProvider } from "starknet";
import Image from 'next/image';
import NFTCard from "@/components/NFTCard";
import SkeletonCard from "@/components/SkeletonCard";
import Hero from "@/components/Hero";
import StatsCard from "@/components/StatsCard";
import Link from "next/link";
import { motion } from "framer-motion";
import { Layers, TrendingUp, Award, Heart, ArrowRight } from "lucide-react";

export interface NftData {
  tokenId: number;
  metadata: any;
  owner: string;
  totalDonations: bigint;
}

interface DonorStat {
  total: bigint;
  donations: { tokenId: number; amount: bigint; name?: string }[];
}

function formatStrk(amount: bigint): string {
  const whole = amount / 10n ** 18n;
  const frac = amount % 10n ** 18n;
  const fracStr = frac.toString().padStart(18, "0").slice(0, 4);
  return `${whole}.${fracStr}`;
}

export default function Home() {
  const [nfts, setNfts] = useState<NftData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [donorStats, setDonorStats] = useState<Record<string, DonorStat>>({});
  const { getProvider } = useStarkNet();

  // Fetch all NFT data from contract
  const fetchNfts = useCallback(async () => {
    if (!contractAddress) return;
    
    try {
      const provider = new RpcProvider({ nodeUrl: RPC_URL });
      const contract = new Contract({ abi: contractAbi as any, address: contractAddress, providerOrAccount: provider });

      // Get total supply
      const totalSupplyResult = await contract.total_supply();
      const totalSupply = Number(totalSupplyResult);

      if (totalSupply === 0) {
        setNfts([]);
        setIsLoading(false);
        return;
      }

      // Fetch data for each NFT
      const nftPromises = Array.from({ length: totalSupply }, async (_, i) => {
        const id = i + 1;
        try {
          const [ownerResult, uriResult, donationsResult] = await Promise.all([
            contract.owner_of(id),
            contract.token_uri(id),
            contract.total_donations(id),
          ]);

          const owner = "0x" + BigInt(ownerResult).toString(16);
          const tokenURI = typeof uriResult === "string" ? uriResult : uriResult.toString();
          const totalDonations = BigInt(donationsResult);

          // Fetch metadata from IPFS
          let metadata = {};
          try {
            const response = await fetch(tokenURI);
            metadata = await response.json();
          } catch (error) {
            console.error(`Failed to fetch metadata for token ${id}:`, error);
          }

          return { tokenId: id, metadata, owner, totalDonations };
        } catch (error) {
          console.error(`Failed to fetch NFT ${id}:`, error);
          return null;
        }
      });

      const results = await Promise.all(nftPromises);
      setNfts(results.filter((r): r is NftData => r !== null));
    } catch (error) {
      console.error("Failed to fetch NFTs:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNfts();
    // Poll every 30 seconds
    const interval = setInterval(fetchNfts, 30000);
    return () => clearInterval(interval);
  }, [fetchNfts]);

  const topDonatedNfts = [...nfts]
    .sort((a, b) => Number(b.totalDonations) - Number(a.totalDonations))
    .slice(0, 10);

  const totalDonationsAll = useMemo(
    () => nfts.reduce((sum, nft) => sum + (nft.totalDonations ?? 0n), 0n),
    [nfts]
  );

  const topSupportedNames = useMemo(() => {
    if (topDonatedNfts.length === 0) return "No support yet";
    return topDonatedNfts
      .slice(0, 3)
      .map((nft) => nft.metadata?.name || `NFT #${nft.tokenId}`)
      .join(", ");
  }, [topDonatedNfts]);

  const handleTotalsChange = useCallback(() => {
    fetchNfts();
  }, [fetchNfts]);

  const handleDonation = useCallback(
    ({ donor, amount, tokenId }: { donor: string; amount: bigint; tokenId: number }) => {
      setDonorStats((prev) => {
        const current = prev[donor] ?? { total: 0n, donations: [] };
        const nft = nfts.find((nft) => nft.tokenId === tokenId);

        return {
          ...prev,
          [donor]: {
            total: current.total + amount,
            donations: [
              ...current.donations,
              { tokenId, amount, name: nft?.metadata?.name },
            ],
          },
        };
      });
    },
    [nfts]
  );

  const topDonors = useMemo(() => {
    const entries = Object.entries(donorStats);
    return entries
      .map(([address, stat]) => ({
        address,
        total: stat.total,
        lastDonation: stat.donations[stat.donations.length - 1],
      }))
      .filter((entry) => entry.total > 0n)
      .sort((a, b) => (a.total < b.total ? 1 : -1))
      .slice(0, 10);
  }, [donorStats]);

  const totalDonationsNum = Number(totalDonationsAll) / 1e18;

  return (
    <main className="relative z-10">
      {/* Hero */}
      <Hero />

      {/* Stats */}
      <section className="container mx-auto px-4 -mt-8 mb-12">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatsCard
            icon={Layers}
            label="Total NFTs"
            value={String(nfts.length)}
            numericValue={nfts.length}
          />
          <StatsCard
            icon={TrendingUp}
            label="Total Donations"
            value={totalDonationsNum.toFixed(4)}
            suffix="STRK"
            numericValue={totalDonationsNum}
          />
          <StatsCard
            icon={Award}
            label="Top Supported"
            value={topSupportedNames}
          />
        </div>
      </section>

      {/* Top NFTs + Top Donors */}
      {nfts.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
          className="container mx-auto px-4 mb-12"
        >
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Top Supported NFTs */}
            <div className="glass-card glow-border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4 text-purple-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Top Supported NFTs</h2>
                  <p className="text-xs text-muted-foreground">
                    Highest total fan donations
                  </p>
                </div>
              </div>
              <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                {topDonatedNfts.map((nft, index) => (
                  <motion.div
                    key={nft.tokenId}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex items-center justify-between rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors p-3"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-sm font-bold text-muted-foreground w-6 text-right">
                        #{index + 1}
                      </span>
                      <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-xl border border-white/[0.08]">
                        <Image
                          src={nft.metadata.image}
                          alt={nft.metadata.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold truncate">{nft.metadata.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatStrk(nft.totalDonations)} STRK
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Top Donors */}
            <div className="glass-card glow-border rounded-2xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                  <Heart className="w-4 h-4 text-cyan-400" />
                </div>
                <div>
                  <h2 className="text-lg font-bold">Top Fan Donors</h2>
                  <p className="text-xs text-muted-foreground">
                    Most generous supporters (this session)
                  </p>
                </div>
              </div>
              {topDonors.length === 0 ? (
                <p className="text-sm text-muted-foreground/60 py-4 text-center">
                  No fan donations yet. Be the first to support a creator.
                </p>
              ) : (
                <ul className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {topDonors.map((entry, index) => (
                    <motion.li
                      key={entry.address}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className="flex items-center justify-between rounded-xl bg-white/[0.03] hover:bg-white/[0.06] transition-colors px-3 py-2.5"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <span className="text-sm font-bold text-muted-foreground w-6 text-right">
                          #{index + 1}
                        </span>
                        <div className="flex flex-col min-w-0">
                          <span className="text-sm font-semibold font-mono truncate">
                            {entry.address.slice(0, 6)}...{entry.address.slice(-4)}
                          </span>
                          {entry.lastDonation?.name && (
                            <span className="text-xs text-muted-foreground truncate">
                              To {entry.lastDonation.name}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-sm font-bold gradient-text">
                        {formatStrk(entry.total)} STRK
                      </span>
                    </motion.li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </motion.section>
      )}

      {/* All NFTs Grid */}
      <section id="nfts" className="container mx-auto px-4 pb-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-6"
        >
          <div>
            <h2 className="text-2xl font-bold">All NFTs</h2>
            <p className="text-sm text-muted-foreground">Browse and support creators</p>
          </div>
          {nfts.length > 0 && (
            <Link href="/mint">
              <button className="gradient-btn-outline text-foreground text-sm font-medium px-4 py-2 rounded-full inline-flex items-center gap-2 hover:bg-white/5 transition-colors">
                Create NFT
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          )}
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {isLoading
            ? Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
            : nfts.length > 0
            ? nfts.map((nft, index) => (
                <NFTCard
                  key={nft.tokenId}
                  nft={nft}
                  index={index}
                  onDonation={handleDonation}
                  onTotalsChange={handleTotalsChange}
                />
              ))
            : !isLoading && (
                <div className="col-span-full text-center py-16">
                  <div className="glass-card glow-border rounded-2xl p-10 max-w-md mx-auto">
                    <Layers className="w-12 h-12 text-purple-400/60 mx-auto mb-4" />
                    <p className="mb-2 text-lg font-semibold">No NFTs found yet</p>
                    <p className="mb-6 text-sm text-muted-foreground">
                      Be the first to mint and support a cause.
                    </p>
                    <Link href="/mint">
                      <button className="gradient-btn text-white font-semibold px-6 py-2.5 rounded-full text-sm inline-flex items-center gap-2">
                        Mint an NFT
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </Link>
                  </div>
                </div>
              )}
        </div>
      </section>
    </main>
  );
}
