"use client";

import { useState } from "react";

export default function Home() {

  const [trade,setTrade] = useState("Electrical");
  const [height,setHeight] = useState("10");
  const [project,setProject] = useState("Residential");

  return (
    <main className="min-h-screen p-8">

      <h1 className="text-4xl font-bold">
        Blueprint AI Estimator
      </h1>

      <p className="mt-3">
        AI-powered construction takeoffs and estimates
      </p>


      <div className="mt-8 space-y-5">

        <div>
          <label>Trade</label>
          <select
            className="border p-2 block"
            value={trade}
            onChange={(e)=>setTrade(e.target.value)}
          >
            <option>Electrical</option>
            <option>Plumbing</option>
            <option>HVAC</option>
            <option>Concrete</option>
            <option>Framing</option>
            <option>Roofing</option>
            <option>General Contractor</option>
          </select>
        </div>


        <div>
          <label>Ceiling Height</label>
          <select
            className="border p-2 block"
            value={height}
            onChange={(e)=>setHeight(e.target.value)}
          >
            <option>8 ft</option>
            <option>9 ft</option>
            <option>10 ft</option>
            <option>12 ft</option>
            <option>14 ft</option>
            <option>16 ft</option>
          </select>
        </div>


        <div>
          <label>Project Type</label>
          <select
            className="border p-2 block"
            value={project}
            onChange={(e)=>setProject(e.target.value)}
          >
            <option>Residential</option>
            <option>Commercial</option>
            <option>Industrial</option>
          </select>
        </div>


        <div>
          <label>
            Upload Blueprint
          </label>

          <input
            className="block"
            type="file"
            multiple
            accept="image/*,.pdf"
          />

        </div>


        <button className="bg-black text-white px-5 py-3 rounded">
          Generate Estimate
        </button>


      </div>

    </main>
  );
}
