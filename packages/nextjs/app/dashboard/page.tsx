"use client";

import { useState } from "react";
import { NextPage } from "next";
import { formatEther, parseEther } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldReadContract, useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const Dashboard: NextPage = () => {
  const { address } = useAccount();
  const [paymentAmount, setPaymentAmount] = useState("");
  const [selectedMortgage, setSelectedMortgage] = useState<number | null>(null);

  // Read user's mortgages (simplified - in production we'd iterate)
  const { data: mortgage0 } = useScaffoldReadContract({
    contractName: "MortgageManager",
    functionName: "getMortgage",
    args: [BigInt(0)],
  });

  const { data: mortgage1 } = useScaffoldReadContract({
    contractName: "MortgageManager",
    functionName: "getMortgage",
    args: [BigInt(1)],
  });

  const { data: mortgage2 } = useScaffoldReadContract({
    contractName: "MortgageManager",
    functionName: "getMortgage",
    args: [BigInt(2)],
  });

  const { writeContractAsync: makePayment, isPending } = useScaffoldWriteContract("MortgageManager");

  const mortgages = [mortgage0, mortgage1, mortgage2]
    .filter(m => m && m.borrower === address && m.status === 2) // Status 2 = Active
    .map((m, idx) => ({
      propertyId: idx,
      ...m,
    }));

  const properties = [
    {
      id: 0,
      address: "123 Blockchain Ave, Crypto City, CC 12345",
      image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=400",
    },
    {
      id: 1,
      address: "456 DeFi Street, Web3 Town, WT 67890",
      image: "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=400",
    },
    {
      id: 2,
      address: "789 Ethereum Boulevard, Smart City, SC 54321",
      image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400",
    },
  ];

  const handlePayment = async (propertyId: number, monthlyPayment: bigint) => {
    if (!paymentAmount && !monthlyPayment) {
      alert("Please enter payment amount");
      return;
    }

    const amount = paymentAmount ? parseEther(paymentAmount) : monthlyPayment;

    try {
      await makePayment({
        functionName: "makePayment",
        args: [BigInt(propertyId)],
        value: amount,
      });
      alert("Payment submitted successfully!");
      setPaymentAmount("");
      setSelectedMortgage(null);
    } catch (error) {
      console.error("Error making payment:", error);
    }
  };

  const getStatusBadge = (status: number) => {
    const statuses = ["None", "Applied", "Active", "Paid Off", "Defaulted", "Foreclosed"];
    const colors = ["badge-ghost", "badge-info", "badge-success", "badge-primary", "badge-error", "badge-warning"];
    return <span className={`badge ${colors[status]}`}>{statuses[status]}</span>;
  };

  const calculateDaysUntilPayment = (lastPaymentTime: bigint) => {
    const monthInSeconds = 30 * 24 * 60 * 60;
    const nextPaymentTime = Number(lastPaymentTime) + monthInSeconds;
    const now = Math.floor(Date.now() / 1000);
    const daysRemaining = Math.ceil((nextPaymentTime - now) / (24 * 60 * 60));
    return daysRemaining;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Your Dashboard</h1>
        <p className="text-base-content/70">Manage your mortgages and track your property ownership</p>
      </div>

      {!address && (
        <div className="alert alert-warning">
          <span>Please connect your wallet to view your dashboard</span>
        </div>
      )}

      {address && mortgages.length === 0 && (
        <div className="card bg-base-100 shadow-xl">
          <div className="card-body items-center text-center py-16">
            <h2 className="text-2xl font-bold mb-4">No Active Mortgages</h2>
            <p className="text-base-content/70 mb-6">
              You don&apos;t have any active mortgages yet. Browse available properties to get started!
            </p>
            <a href="/properties" className="btn btn-primary">
              Browse Properties
            </a>
          </div>
        </div>
      )}

      {mortgages.length > 0 && (
        <div className="space-y-6">
          {mortgages.map(mortgage => {
            if (!mortgage) return null;
            const property = properties.find(p => p.id === mortgage.propertyId);
            const ownershipPercent = Number(mortgage.ownershipSharesBPS) / 100;
            const remainingBalance =
              (mortgage.loanAmount || BigInt(0)) -
              ((mortgage.totalPaid || BigInt(0)) - (mortgage.downPayment || BigInt(0)));
            const daysUntilPayment = calculateDaysUntilPayment(mortgage.lastPaymentTimestamp || BigInt(0));
            const isOverdue = daysUntilPayment < 0;

            return (
              <div key={mortgage.propertyId} className="card bg-base-100 shadow-xl">
                <div className="card-body">
                  <div className="flex flex-col lg:flex-row gap-6">
                    {/* Property Image */}
                    <div className="flex-shrink-0">
                      <img
                        src={property?.image}
                        alt={property?.address}
                        className="w-full lg:w-64 h-48 object-cover rounded-lg"
                      />
                    </div>

                    {/* Mortgage Details */}
                    <div className="flex-grow">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-2xl font-bold">{property?.address}</h3>
                          <p className="text-base-content/70">Property #{mortgage.propertyId}</p>
                        </div>
                        {getStatusBadge(mortgage.status || 0)}
                      </div>

                      {/* Ownership Progress */}
                      <div className="mb-6">
                        <div className="flex justify-between mb-2">
                          <span className="font-semibold">Your Ownership</span>
                          <span className="text-2xl font-bold text-primary">{ownershipPercent.toFixed(1)}%</span>
                        </div>
                        <progress
                          className="progress progress-primary w-full h-4"
                          value={ownershipPercent}
                          max="100"
                        ></progress>
                      </div>

                      {/* Financial Stats */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                        <div>
                          <p className="text-xs text-base-content/60">Property Value</p>
                          <p className="font-bold">
                            {formatEther(mortgage.propertyValue || BigInt(0)).substring(0, 6)} ETH
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-base-content/60">Remaining Balance</p>
                          <p className="font-bold">{formatEther(remainingBalance).substring(0, 6)} ETH</p>
                        </div>
                        <div>
                          <p className="text-xs text-base-content/60">Monthly Payment</p>
                          <p className="font-bold">
                            {formatEther(mortgage.monthlyPayment || BigInt(0)).substring(0, 5)} ETH
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-base-content/60">Payments Made</p>
                          <p className="font-bold">
                            {(mortgage.paymentsCount || 0).toString()} / {(mortgage.durationMonths || 0).toString()}
                          </p>
                        </div>
                      </div>

                      {/* Payment Status */}
                      <div className={`alert ${isOverdue ? "alert-error" : "alert-info"} mb-4`}>
                        <span className="text-sm">
                          {isOverdue
                            ? `⚠️ Payment is ${Math.abs(daysUntilPayment)} days overdue! Late fees may apply.`
                            : `📅 Next payment due in ${daysUntilPayment} days`}
                        </span>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex gap-2">
                        <button
                          className="btn btn-primary"
                          onClick={() => setSelectedMortgage(Number(mortgage.propertyId))}
                        >
                          Make Payment
                        </button>
                        <button className="btn btn-outline">View History</button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Payment Modal */}
      {selectedMortgage !== null && (
        <div className="modal modal-open">
          <div className="modal-box">
            <h3 className="font-bold text-lg mb-4">Make Mortgage Payment</h3>

            {(() => {
              const mortgage = mortgages.find(m => m.propertyId === selectedMortgage);
              if (!mortgage) return null;

              const property = properties.find(p => p.id === selectedMortgage);
              const daysUntilPayment = calculateDaysUntilPayment(mortgage.lastPaymentTimestamp || BigInt(0));
              const isOverdue = daysUntilPayment < 0;
              const monthlyPayment = mortgage.monthlyPayment || BigInt(0);
              const expectedPayment = isOverdue
                ? monthlyPayment + (monthlyPayment * BigInt(500)) / BigInt(10000) // 5% late fee
                : monthlyPayment;

              return (
                <>
                  <div className="mb-4">
                    <p className="text-sm text-base-content/70 mb-2">Property</p>
                    <p className="font-semibold">{property?.address}</p>
                  </div>

                  <div className="bg-base-200 p-4 rounded-lg mb-4">
                    <div className="flex justify-between mb-2">
                      <span>Monthly Payment:</span>
                      <span className="font-bold">{formatEther(monthlyPayment)} ETH</span>
                    </div>
                    {isOverdue && (
                      <div className="flex justify-between text-error">
                        <span>Late Fee (5%):</span>
                        <span className="font-bold">
                          {formatEther((monthlyPayment * BigInt(500)) / BigInt(10000))} ETH
                        </span>
                      </div>
                    )}
                    <div className="divider my-2"></div>
                    <div className="flex justify-between text-lg">
                      <span className="font-semibold">Total Due:</span>
                      <span className="font-bold text-primary">{formatEther(expectedPayment)} ETH</span>
                    </div>
                  </div>

                  <div className="form-control mb-4">
                    <label className="label">
                      <span className="label-text">Payment Amount (ETH)</span>
                    </label>
                    <input
                      type="number"
                      placeholder={formatEther(expectedPayment)}
                      className="input input-bordered"
                      value={paymentAmount}
                      onChange={e => setPaymentAmount(e.target.value)}
                      step="0.01"
                    />
                    <label className="label">
                      <span className="label-text-alt">Leave empty to pay exact amount due</span>
                    </label>
                  </div>

                  <div className="modal-action">
                    <button
                      className="btn"
                      onClick={() => {
                        setSelectedMortgage(null);
                        setPaymentAmount("");
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary"
                      onClick={() => handlePayment(selectedMortgage, expectedPayment)}
                      disabled={isPending}
                    >
                      {isPending ? "Processing..." : "Confirm Payment"}
                    </button>
                  </div>
                </>
              );
            })()}
          </div>
          <div className="modal-backdrop" onClick={() => setSelectedMortgage(null)}></div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
