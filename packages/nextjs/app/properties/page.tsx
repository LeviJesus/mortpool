"use client";

import { useState } from "react";
import { NextPage } from "next";
import { formatEther, parseEther } from "viem";
import { useAccount } from "wagmi";
import { useScaffoldWriteContract } from "~~/hooks/scaffold-eth";

const Properties: NextPage = () => {
  const { address } = useAccount();
  const [selectedProperty, setSelectedProperty] = useState<number | null>(null);
  const [downPayment, setDownPayment] = useState("");
  const [durationYears, setDurationYears] = useState("30");

  // Total properties available (hardcoded for demo)

  // Mock property data (in production, we'd read each property)
  const properties = [
    {
      id: 0,
      address: "123 Blockchain Ave, Crypto City, CC 12345",
      value: "200",
      image: "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=800",
      description: "Modern 3BR/2BA suburban home with smart contract deed",
      beds: 3,
      baths: 2,
    },
    {
      id: 1,
      address: "456 DeFi Street, Web3 Town, WT 67890",
      value: "150",
      image: "https://images.unsplash.com/photo-1572120360610-d971b9d7767c?w=800",
      description: "Cozy 2BR/1BA starter home with NFT title",
      beds: 2,
      baths: 1,
    },
    {
      id: 2,
      address: "789 Ethereum Boulevard, Smart City, SC 54321",
      value: "350",
      image: "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800",
      description: "Luxury 4BR/3BA family home with pool and tokenized ownership",
      beds: 4,
      baths: 3,
    },
  ];

  const { writeContractAsync: applyForMortgage, isPending } = useScaffoldWriteContract("MortgageManager");

  const handleApply = async (propertyId: number, propertyValue: string) => {
    if (!downPayment) {
      alert("Please enter a down payment");
      return;
    }

    const downPaymentEth = parseEther(downPayment);
    const propertyValueEth = parseEther(propertyValue);
    const minDownPayment = propertyValueEth / BigInt(10); // 10%

    if (downPaymentEth < minDownPayment) {
      alert(`Minimum down payment is ${formatEther(minDownPayment)} ETH (10%)`);
      return;
    }

    try {
      await applyForMortgage({
        functionName: "applyForMortgage",
        args: [BigInt(propertyId), BigInt(parseInt(durationYears) * 12)],
        value: downPaymentEth,
      });
      alert("Mortgage application submitted successfully!");
      setSelectedProperty(null);
      setDownPayment("");
    } catch (error) {
      console.error("Error applying for mortgage:", error);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Available Properties</h1>
        <p className="text-base-content/70">Browse tokenized properties and apply for on-chain mortgages</p>
      </div>

      {!address && (
        <div className="alert alert-warning mb-8">
          <span>Please connect your wallet to apply for mortgages</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map(property => (
          <div key={property.id} className="card bg-base-100 shadow-xl">
            <figure className="h-48 overflow-hidden">
              <img src={property.image} alt={property.address} className="w-full h-full object-cover" />
            </figure>
            <div className="card-body">
              <h2 className="card-title text-lg">{property.address}</h2>
              <div className="flex gap-2 text-sm text-base-content/70 mb-2">
                <span>🛏️ {property.beds} beds</span>
                <span>🚿 {property.baths} baths</span>
              </div>
              <p className="text-sm text-base-content/70">{property.description}</p>

              <div className="divider my-2"></div>

              <div className="flex justify-between items-center">
                <div>
                  <p className="text-xs text-base-content/60">Property Value</p>
                  <p className="text-2xl font-bold text-primary">{property.value} ETH</p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-base-content/60">Min. Down Payment</p>
                  <p className="text-lg font-semibold">{(parseFloat(property.value) * 0.1).toFixed(1)} ETH</p>
                </div>
              </div>

              <div className="card-actions justify-end mt-4">
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setSelectedProperty(property.id)}
                  disabled={!address}
                >
                  Apply for Mortgage
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Application Modal */}
      {selectedProperty !== null && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">Apply for Mortgage</h3>

            <div className="mb-4">
              <p className="text-sm text-base-content/70 mb-2">Property</p>
              <p className="font-semibold">{properties[selectedProperty].address}</p>
              <p className="text-2xl font-bold text-primary mt-2">{properties[selectedProperty].value} ETH</p>
            </div>

            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Down Payment (ETH)</span>
                <span className="label-text-alt text-base-content/60">
                  Min: {(parseFloat(properties[selectedProperty].value) * 0.1).toFixed(1)} ETH (10%)
                </span>
              </label>
              <input
                type="number"
                placeholder="20"
                className="input input-bordered"
                value={downPayment}
                onChange={e => setDownPayment(e.target.value)}
                step="0.1"
              />
            </div>

            <div className="form-control mb-4">
              <label className="label">
                <span className="label-text">Loan Duration (Years)</span>
              </label>
              <select
                className="select select-bordered"
                value={durationYears}
                onChange={e => setDurationYears(e.target.value)}
              >
                <option value="10">10 years</option>
                <option value="15">15 years</option>
                <option value="20">20 years</option>
                <option value="25">25 years</option>
                <option value="30">30 years</option>
              </select>
            </div>

            {downPayment && (
              <div className="bg-base-200 p-4 rounded-lg mb-4">
                <h4 className="font-semibold mb-2">Loan Details</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Loan Amount:</span>
                    <span className="font-semibold">
                      {(parseFloat(properties[selectedProperty].value) - parseFloat(downPayment)).toFixed(2)} ETH
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span>Interest Rate:</span>
                    <span className="font-semibold text-success">5.0% APR</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Initial Ownership:</span>
                    <span className="font-semibold text-primary">
                      {((parseFloat(downPayment) / parseFloat(properties[selectedProperty].value)) * 100).toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="modal-action">
              <button className="btn" onClick={() => setSelectedProperty(null)}>
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={() => handleApply(selectedProperty, properties[selectedProperty].value)}
                disabled={isPending || !downPayment}
              >
                {isPending ? "Submitting..." : "Submit Application"}
              </button>
            </div>
          </div>
          <div className="modal-backdrop" onClick={() => setSelectedProperty(null)}></div>
        </div>
      )}
    </div>
  );
};

export default Properties;
