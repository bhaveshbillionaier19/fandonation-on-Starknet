"use client";

import * as React from "react";
import { createContext, useContext, useState, useCallback, useEffect } from "react";
import { connect, disconnect as disconnectWallet } from "get-starknet";
import { Contract, RpcProvider, type AccountInterface } from "starknet";
import { contractAddress, contractAbi, RPC_URL } from "@/constants";

interface StarkNetContextType {
  account: AccountInterface | null;
  address: string;
  isConnected: boolean;
  isConnecting: boolean;
  connectWallet: () => Promise<void>;
  disconnect: () => void;
  getProvider: () => RpcProvider;
  getContract: (signer?: AccountInterface | RpcProvider) => Contract;
}

const StarkNetContext = createContext<StarkNetContextType>({
  account: null,
  address: "",
  isConnected: false,
  isConnecting: false,
  connectWallet: async () => {},
  disconnect: () => {},
  getProvider: () => new RpcProvider({ nodeUrl: RPC_URL }),
  getContract: () => new Contract(contractAbi, contractAddress, new RpcProvider({ nodeUrl: RPC_URL })),
});

export function useStarkNet() {
  return useContext(StarkNetContext);
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<AccountInterface | null>(null);
  const [address, setAddress] = useState("");
  const [isConnecting, setIsConnecting] = useState(false);

  const getProvider = useCallback(() => {
    return new RpcProvider({ nodeUrl: RPC_URL });
  }, []);

  const getContract = useCallback(
    (signer?: AccountInterface | RpcProvider) => {
      return new Contract(contractAbi, contractAddress, signer || getProvider());
    },
    [getProvider]
  );

  const handleConnect = useCallback(async () => {
    setIsConnecting(true);
    try {
      const starknet = await connect({ modalMode: "alwaysAsk" });
      if (!starknet) {
        throw new Error("No StarkNet wallet found. Please install Argent X.");
      }
      await starknet.enable();
      if (starknet.account) {
        setAccount(starknet.account);
        setAddress(starknet.selectedAddress || starknet.account.address);
      }
    } catch (error) {
      console.error("Failed to connect:", error);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  const handleDisconnect = useCallback(() => {
    disconnectWallet();
    setAccount(null);
    setAddress("");
  }, []);

  // Try to restore connection on mount
  useEffect(() => {
    const tryReconnect = async () => {
      try {
        const starknet = await connect({ modalMode: "neverAsk" });
        if (starknet && starknet.isConnected) {
          await starknet.enable();
          if (starknet.account) {
            setAccount(starknet.account);
            setAddress(starknet.selectedAddress || starknet.account.address);
          }
        }
      } catch {
        // Silent fail on reconnect
      }
    };
    tryReconnect();
  }, []);

  return (
    <StarkNetContext.Provider
      value={{
        account,
        address,
        isConnected: !!account,
        isConnecting,
        connectWallet: handleConnect,
        disconnect: handleDisconnect,
        getProvider,
        getContract,
      }}
    >
      {children}
    </StarkNetContext.Provider>
  );
}
