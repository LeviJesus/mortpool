"use client";

import { useState } from "react";
import { NextPage } from "next";
import { formatEther, parseEther } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const Liquidity: NextPage = () => {
  const { address } = useAccount();
  const [depositAmount, setDepositAmount] = useState("");
  const [withdrawShares, setWithdrawShares] = useState("");

  // Read pool data
  const { data: totalLiquidity } = useScaffoldReadContract({
    contractName: "MortgagePool",
    functionName: "totalLiquidity",
  });

  const { data: activeMortgages } = useScaffoldReadContract({
    contractName: "MortgagePool",
    functionName: "activeMortgages",
  });

  const { data: insuranceReserve } = useScaffoldReadContract({
    contractName: "MortgagePool",
    functionName: "insuranceReserve",
  });

  const { data: totalInterestEarned } = useScaffoldReadContract({
    contractName: "MortgagePool",
    functionName: "totalInterestEarned",
  });

  const { data: estimatedAPY } = useScaffoldReadContract({
    contractName: "MortgagePool",
    functionName: "estimatedAPY",
  });

  const { data: userShares } = useScaffoldReadContract({
    contractName: "MortgagePool",
    functionName: "lpShares",
    args: [address],
  });

  const { data: userShareValue } = useScaffoldReadContract({
    contractName: "MortgagePool",
    functionName: "getShareValue",
    args: [address],
  });

  // Available liquidity can be calculated from totalLiquidity - activeMortgages

  const { writeContractAsync: depositLiquidity, isPending: isDepositing } = useScaffoldWriteContract("MortgagePool");
  const { writeContractAsync: withdrawLiquidity, isPending: isWithdrawing } = useScaffoldWriteContract("MortgagePool");

  const handleDeposit = async () => {
    if (!depositAmount) {
      alert("Please enter an amount");
      return;
    }

    try {
      await depositLiquidity({
        functionName: "depositLiquidity",
        value: parseEther(depositAmount),
      });
      alert("Liquidity deposited successfully!");
      setDepositAmount("");
    } catch (error) {
      console.error("Error depositing liquidity:", error);
    }
  };

  const handleWithdraw = async () => {
    if (!withdrawShares) {
      alert("Please enter shares amount");
      return;
    }

    try {
      await withdrawLiquidity({
        functionName: "withdrawLiquidity",
        args: [parseEther(withdrawShares)],
      });
      alert("Liquidity withdrawn successfully!");
      setWithdrawShares("");
    } catch (error) {
      console.error("Error withdrawing liquidity:", error);
    }
  };

  const utilizationRate =
    totalLiquidity && totalLiquidity > BigInt(0)
      ? Number(((activeMortgages || BigInt(0)) * BigInt(100)) / totalLiquidity)
      : 0;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Liquidity Pool</h1>
        <p className="text-base-content/70">Provide liquidity to earn yield from mortgage interest payments</p>
      </div>

      {!address && (
        <div className="alert alert-warning mb-8">
          <span>Please connect your wallet to participate</span>
        </div>
      )}

      {/* Pool Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="stat bg-base-100 shadow rounded-lg">
          <div className="stat-title">Total Pool Value</div>
          <div className="stat-value text-primary text-2xl">
            {totalLiquidity ? formatEther(totalLiquidity).substring(0, 6) : "0"} ETH
          </div>
          <div className="stat-desc">Available liquidity for mortgages</div>
        </div>

        <div className="stat bg-base-100 shadow rounded-lg">
          <div className="stat-title">Estimated APY</div>
          <div className="stat-value text-secondary text-2xl">{estimatedAPY ? Number(estimatedAPY) / 100 : "3.5"}%</div>
          <div className="stat-desc">Annual percentage yield</div>
        </div>

        <div className="stat bg-base-100 shadow rounded-lg">
          <div className="stat-title">Active Mortgages</div>
          <div className="stat-value text-accent text-2xl">
            {activeMortgages ? formatEther(activeMortgages).substring(0, 6) : "0"} ETH
          </div>
          <div className="stat-desc">Currently deployed capital</div>
        </div>

        <div className="stat bg-base-100 shadow rounded-lg">
          <div className="stat-title">Insurance Reserve</div>
          <div className="stat-value text-info text-2xl">
            {insuranceReserve ? formatEther(insuranceReserve).substring(0, 6) : "0"} ETH
          </div>
          <div className="stat-desc">Default protection fund</div>
        </div>
      </div>

      {/* Utilization Progress */}
      <div className="card bg-base-100 shadow-xl mb-8">
        <div className="card-body">
          <h3 className="card-title">Pool Utilization</h3>
          <div className="flex items-center gap-4">
            <progress className="progress progress-primary w-full" value={utilizationRate} max="100"></progress>
            <span className="font-semibold">{utilizationRate.toFixed(1)}%</span>
          </div>
          <p className="text-sm text-base-content/70">
            {activeMortgages && totalLiquidity
              ? `${formatEther(activeMortgages).substring(0, 6)} ETH deployed out of ${formatEther(totalLiquidity).substring(0, 6)} ETH total`
              : "No mortgages active yet"}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Deposit Section */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">💰 Deposit Liquidity</h2>
            <p className="text-sm text-base-content/70 mb-4">
              Deposit ETH to become a liquidity provider and earn {estimatedAPY ? Number(estimatedAPY) / 100 : "3.5"}%
              APY
            </p>

            <div className="form-control">
              <label className="label">
                <span className="label-text">Amount (ETH)</span>
              </label>
              <input
                type="number"
                placeholder="10.0"
                className="input input-bordered input-lg"
                value={depositAmount}
                onChange={e => setDepositAmount(e.target.value)}
                step="0.1"
                disabled={!address}
              />
            </div>

            <div className="bg-base-200 p-4 rounded-lg mt-4">
              <h4 className="font-semibold mb-2 text-sm">Benefits</h4>
              <ul className="text-sm space-y-1">
                <li>✓ Earn passive income from mortgage interest</li>
                <li>✓ 2% insurance protection against defaults</li>
                <li>✓ Withdraw anytime (if liquidity available)</li>
                <li>✓ Proportional share of all pool earnings</li>
              </ul>
            </div>

            <button
              className="btn btn-primary btn-lg mt-4"
              onClick={handleDeposit}
              disabled={!address || isDepositing || !depositAmount}
            >
              {isDepositing ? "Depositing..." : "Deposit Liquidity"}
            </button>
          </div>
        </div>

        {/* Withdraw Section */}
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            <h2 className="card-title text-2xl mb-4">💸 Withdraw Liquidity</h2>

            {address && userShares !== undefined && userShares > BigInt(0) ? (
              <>
                <div className="stats stats-vertical shadow mb-4">
                  <div className="stat">
                    <div className="stat-title">Your Shares</div>
                    <div className="stat-value text-primary text-xl">{formatEther(userShares).substring(0, 10)}</div>
                  </div>
                  <div className="stat">
                    <div className="stat-title">Current Value</div>
                    <div className="stat-value text-secondary text-xl">
                      {userShareValue ? formatEther(userShareValue).substring(0, 10) : "0"} ETH
                    </div>
                  </div>
                </div>

                <div className="form-control">
                  <label className="label">
                    <span className="label-text">Shares to Withdraw</span>
                    <span className="label-text-alt">Max: {formatEther(userShares).substring(0, 10)}</span>
                  </label>
                  <input
                    type="number"
                    placeholder="0.0"
                    className="input input-bordered input-lg"
                    value={withdrawShares}
                    onChange={e => setWithdrawShares(e.target.value)}
                    step="0.1"
                  />
                </div>

                <div className="alert alert-info mt-4">
                  <span className="text-sm">
                    Withdrawals are subject to available liquidity. Funds locked in active mortgages cannot be withdrawn
                    immediately.
                  </span>
                </div>

                <button
                  className="btn btn-secondary btn-lg mt-4"
                  onClick={handleWithdraw}
                  disabled={isWithdrawing || !withdrawShares}
                >
                  {isWithdrawing ? "Withdrawing..." : "Withdraw Liquidity"}
                </button>
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-base-content/70 mb-4">You don&apos;t have any liquidity deposited yet</p>
                <p className="text-sm text-base-content/60">Deposit ETH to start earning yield</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Total Interest Earned */}
      {totalInterestEarned && totalInterestEarned > BigInt(0) && (
        <div className="card bg-gradient-to-r from-primary to-secondary text-primary-content shadow-xl mt-8">
          <div className="card-body items-center text-center">
            <h3 className="card-title text-2xl">📈 Total Interest Earned by Pool</h3>
            <p className="text-4xl font-bold">{formatEther(totalInterestEarned).substring(0, 8)} ETH</p>
            <p>Distributed proportionally to all liquidity providers</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Liquidity;
