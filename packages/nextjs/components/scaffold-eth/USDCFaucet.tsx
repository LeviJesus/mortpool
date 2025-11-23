"use client";

import { useState } from "react";
import { formatUnits } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

/**
 * USDC Faucet Button Component
 * Allows users to mint 10,000 test USDC for demo purposes
 */
export const USDCFaucet = () => {
  const { address } = useAccount();
  const [isLoading, setIsLoading] = useState(false);

  // Read user's USDC balance
  const { data: usdcBalance } = useScaffoldReadContract({
    contractName: "MockUSDC",
    functionName: "balanceOf",
    args: [address],
  });

  const { writeContractAsync: callFaucet } = useScaffoldWriteContract("MockUSDC");

  const handleFaucet = async () => {
    if (!address) return;

    setIsLoading(true);
    try {
      await callFaucet({
        functionName: "faucet",
      });
    } catch (error) {
      console.error("Faucet error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!address) return null;

  // Format USDC balance (6 decimals)
  const formattedBalance = usdcBalance ? formatUnits(usdcBalance, 6) : "0";

  return (
    <div className="flex items-center gap-2">
      <div className="tooltip tooltip-bottom" data-tip={`${formattedBalance} USDC`}>
        <button className="btn btn-sm btn-secondary" onClick={handleFaucet} disabled={isLoading}>
          {isLoading ? <span className="loading loading-spinner loading-xs"></span> : "💵 Get Test USDC"}
        </button>
      </div>
    </div>
  );
};
