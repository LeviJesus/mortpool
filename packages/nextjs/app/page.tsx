"use client";

import Link from "next/link";
import type { NextPage } from "next";
import { useAccount } from "wagmi";
import { BanknotesIcon, ChartBarIcon, HomeIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";

const Home: NextPage = () => {
  const { address: connectedAddress } = useAccount();

  return (
    <>
      <div className="flex items-center flex-col grow pt-10">
        {/* Hero Section */}
        <div className="px-5 text-center max-w-4xl">
          <h1 className="text-center mb-4">
            <span className="block text-2xl mb-2 font-semibold">Welcome to</span>
            <span className="block text-5xl font-bold text-primary">Mortgage Pool Protocol</span>
          </h1>
          <p className="text-xl mb-8">
            Get mortgages with better rates through decentralized liquidity pools.
            <br />
            Buy real-world assets on-chain with transparent, fair financing.
          </p>

          {!connectedAddress && (
            <div className="alert alert-warning max-w-md mx-auto">
              <ShieldCheckIcon className="h-6 w-6" />
              <span>Connect your wallet to get started</span>
            </div>
          )}
        </div>

        {/* Stats Section */}
        <div className="w-full max-w-6xl px-5 mt-12">
          <div className="stats stats-vertical lg:stats-horizontal shadow w-full">
            <div className="stat place-items-center">
              <div className="stat-title font-semibold">Interest Rate</div>
              <div className="stat-value text-success">5.0%</div>
              <div className="stat-desc font-medium">vs 8% traditional</div>
            </div>

            <div className="stat place-items-center">
              <div className="stat-title font-semibold">LP APY</div>
              <div className="stat-value text-info">3.5%</div>
              <div className="stat-desc font-medium">Earn passive income</div>
            </div>

            <div className="stat place-items-center">
              <div className="stat-title font-semibold">Active Mortgages</div>
              <div className="stat-value text-primary">3</div>
              <div className="stat-desc font-medium">Properties available</div>
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="w-full bg-base-300 mt-16 px-8 py-16">
          <h2 className="text-3xl font-bold text-center mb-12">How It Works</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* For Borrowers */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body items-center text-center">
                <HomeIcon className="h-12 w-12 text-primary mb-4" />
                <h3 className="card-title">For Borrowers</h3>
                <ul className="text-left space-y-2">
                  <li>✓ Browse tokenized properties</li>
                  <li>✓ Apply with 10-20% down payment</li>
                  <li>✓ Get instant approval</li>
                  <li>✓ Track ownership growth</li>
                  <li>✓ Pay lower interest rates</li>
                </ul>
                <div className="card-actions mt-4">
                  <Link href="/properties" className="btn btn-primary">
                    Browse Properties
                  </Link>
                </div>
              </div>
            </div>

            {/* For Liquidity Providers */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body items-center text-center">
                <BanknotesIcon className="h-12 w-12 text-secondary mb-4" />
                <h3 className="card-title">For Lenders</h3>
                <ul className="text-left space-y-2">
                  <li>✓ Deposit ETH into pool</li>
                  <li>✓ Earn 3.5% APY</li>
                  <li>✓ Automatic yield distribution</li>
                  <li>✓ Insurance protection</li>
                  <li>✓ Withdraw anytime</li>
                </ul>
                <div className="card-actions mt-4">
                  <Link href="/liquidity" className="btn btn-secondary">
                    Provide Liquidity
                  </Link>
                </div>
              </div>
            </div>

            {/* Security */}
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body items-center text-center">
                <ChartBarIcon className="h-12 w-12 text-accent mb-4" />
                <h3 className="card-title">Your Dashboard</h3>
                <ul className="text-left space-y-2">
                  <li>✓ View active mortgages</li>
                  <li>✓ Track payment history</li>
                  <li>✓ Monitor ownership %</li>
                  <li>✓ See pool performance</li>
                  <li>✓ Manage portfolio</li>
                </ul>
                <div className="card-actions mt-4">
                  <Link href="/dashboard" className="btn btn-accent">
                    Go to Dashboard
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits Section */}
        <div className="w-full max-w-4xl px-5 py-16">
          <h2 className="text-3xl font-bold text-center mb-8">Why Mortgage Pool?</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex gap-4">
              <div className="text-primary text-3xl">🏦</div>
              <div>
                <h3 className="font-bold mb-2">Lower Rates</h3>
                <p className="text-sm">No bank overhead means better rates for borrowers and lenders</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-primary text-3xl">⚡</div>
              <div>
                <h3 className="font-bold mb-2">Instant Approval</h3>
                <p className="text-sm">Smart contracts automate underwriting and approval</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-primary text-3xl">🔒</div>
              <div>
                <h3 className="font-bold mb-2">Transparent & Secure</h3>
                <p className="text-sm">All terms and transactions visible on-chain</p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="text-primary text-3xl">📊</div>
              <div>
                <h3 className="font-bold mb-2">Incremental Ownership</h3>
                <p className="text-sm">Watch your property ownership grow with each payment</p>
              </div>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="w-full bg-primary text-primary-content py-12 px-5">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
            <p className="mb-8">
              Whether you&apos;re looking to buy property or earn yield on your crypto,
              <br />
              Mortgage Pool makes it simple and transparent.
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              <Link href="/properties" className="btn btn-secondary btn-lg">
                Browse Properties
              </Link>
              <Link href="/debug" className="btn btn-outline btn-lg">
                View Contracts
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Home;
