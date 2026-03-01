import { useState, useMemo, useCallback } from "react"
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, ReferenceLine } from "recharts"
import { TrendingUp, Shield, Eye, Globe, Settings, BarChart3, Target, Brain, Lock, AlertTriangle, ChevronDown, ChevronUp, Info } from "lucide-react"

const COLORS = {
  bg: "#0F172A",
  card: "#1E293B",
  accent: "#0891B2",
  text: "#F8FAFC",
  muted: "#94A3B8",
  chart: ["#0891B2", "#06B6D4", "#22D3EE", "#F59E0B", "#EF4444", "#8B5CF6", "#10B981"],
}

// Historical data
const HISTORICAL = { 2019: 69.66, 2020: 84.17, 2021: 114.93, 2022: 113.64, 2023: 131.95, 2024: 160.89 }

// AI Channels configuration
const AI_CHANNELS = {
  ai_targeting: { label: "AI Targeting", ceiling: 45, inflection: 2026, color: "#0891B2" },
  ai_creative: { label: "AI Creative", ceiling: 35, inflection: 2025, color: "#06B6D4" },
  ai_surfaces: { label: "AI Surfaces", ceiling: 28, inflection: 2027, color: "#22D3EE" },
  ai_messaging: { label: "AI Messaging", ceiling: 22, inflection: 2025, color: "#F59E0B" },
  ai_infrastructure: { label: "AI Infrastructure", ceiling: 18, inflection: 2026, color: "#8B5CF6" },
  ai_measurement: { label: "AI Measurement", ceiling: 15, inflection: 2028, color: "#10B981" },
}

// Utility functions
const sCurve = (ceiling, inflection, year, steepness = 0.5) => {
  const adoption = ceiling / (1 + Math.exp(-steepness * (year - inflection)))
  return Math.max(0, Math.min(adoption, ceiling))
}

const generateMonteCarlo = (baseRevenue, volatility, samples = 1000) => {
  const results = []
  for (let i = 0; i < samples; i++) {
    const u1 = Math.random()
    const u2 = Math.random()
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2)
    results.push(baseRevenue * (1 + z * volatility))
  }
  return results.sort((a, b) => a - b)
}

const formatCurrency = (value) => {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}T`
  return `$${value.toFixed(1)}B`
}

const formatPercent = (value) => `${(value * 100).toFixed(1)}%`

// Main component
export default function RevenueHorizonApp() {
  const [activeTab, setActiveTab] = useState(0)
  const [aiRevenuePercent, setAiRevenuePercent] = useState(0.32)
  const [tamGrowth, setTamGrowth] = useState(0.09)
  const [cannibalization, setCannibalization] = useState(0.18)
  const [privacyRisk, setPrivacyRisk] = useState(0.35)
  const [competitiveIntensity, setCompetitiveIntensity] = useState(0.5)
  const [regionalGrowth, setRegionalGrowth] = useState({ us: 0.11, eu: 0.065, apac: 0.14, row: 0.08 })
  const [scenario, setScenario] = useState("base")

  // Apply scenario presets
  const applyScenario = useCallback((scenarioType) => {
    setScenario(scenarioType)
    switch (scenarioType) {
      case "bull":
        setAiRevenuePercent(0.42)
        setTamGrowth(0.11)
        setCannibalization(0.12)
        setPrivacyRisk(0.20)
        setCompetitiveIntensity(0.35)
        break
      case "base":
        setAiRevenuePercent(0.32)
        setTamGrowth(0.09)
        setCannibalization(0.18)
        setPrivacyRisk(0.35)
        setCompetitiveIntensity(0.5)
        break
      case "bear":
        setAiRevenuePercent(0.22)
        setTamGrowth(0.07)
        setCannibalization(0.25)
        setPrivacyRisk(0.50)
        setCompetitiveIntensity(0.65)
        break
    }
  }, [])

  // Compute forecast data
  const forecastData = useMemo(() => {
    const years = Array.from({ length: 11 }, (_, i) => 2020 + i)
    const data = []

    years.forEach((year) => {
      let traditional = HISTORICAL[year] || 0
      let aiRevenue = 0

      if (year > 2024) {
        // Polynomial baseline extrapolation
        const x = year - 2020
        traditional = 85 + 15 * x + 1.5 * x * x

        // AI contribution via S-curves
        Object.values(AI_CHANNELS).forEach((channel) => {
          const adoption = sCurve(channel.ceiling, channel.inflection, year)
          aiRevenue += adoption
        })

        // Apply cannibalization
        const cannibalizedAmount = traditional * cannibalization
        traditional -= cannibalizedAmount
        aiRevenue -= cannibalizedAmount * 0.5
      }

      const total = traditional + aiRevenue
      const aiPercent = total > 0 ? aiRevenue / total : 0

      data.push({
        year,
        traditional: parseFloat(traditional.toFixed(2)),
        ai: parseFloat(aiRevenue.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        aiPercent: parseFloat(aiPercent.toFixed(4)),
      })
    })

    return data
  }, [cannibalization])

  // Market and TAM analysis
  const marketData = useMemo(() => {
    const years = Array.from({ length: 11 }, (_, i) => 2020 + i)
    const data = []

    years.forEach((year) => {
      const tam = 740 * Math.pow(1 + tamGrowth, year - 2020)
      const companyRevenue = forecastData.find((d) => d.year === year)?.total || 0
      const marketShare = (companyRevenue / tam) * 100

      data.push({
        year,
        tam: parseFloat(tam.toFixed(1)),
        companyRevenue: parseFloat(companyRevenue.toFixed(2)),
        marketShare: parseFloat(marketShare.toFixed(2)),
      })
    })

    return data
  }, [forecastData, tamGrowth])

  // Format mix analysis
  const formatMixData = useMemo(() => {
    return [
      { name: "Search", 2025: 45, 2027: 38, 2030: 28 },
      { name: "Social", 2025: 28, 2027: 25, 2030: 20 },
      { name: "Retail Media", 2025: 15, 2027: 18, 2030: 22 },
      { name: "CTV", 2025: 8, 2027: 12, 2030: 15 },
      { name: "AI-Native", 2025: 4, 2027: 7, 2030: 15 },
    ]
  }, [])

  // AI adoption curves
  const aiAdoptionData = useMemo(() => {
    const years = Array.from({ length: 11 }, (_, i) => 2020 + i)
    return years.map((year) => {
      const row = { year }
      Object.entries(AI_CHANNELS).forEach(([key, channel]) => {
        row[key] = parseFloat(sCurve(channel.ceiling, channel.inflection, year).toFixed(2))
      })
      return row
    })
  }, [])

  // Cannibalization matrix
  const cannibalizationMatrix = useMemo(() => {
    return [
      { channel: "Search", direct: 18, social: 5, retail: 3, ctv: 2 },
      { channel: "Social", search: 8, direct: 12, retail: 4, ctv: 3 },
      { channel: "Retail", search: 6, social: 4, direct: 14, ctv: 2 },
      { channel: "CTV", search: 4, social: 3, retail: 2, direct: 8 },
      { channel: "AI-Native", search: 2, social: 2, retail: 1, ctv: 1 },
    ]
  }, [])

  // Privacy timeline
  const privacyData = useMemo(() => {
    const years = Array.from({ length: 11 }, (_, i) => 2020 + i)
    return years.map((year) => {
      const degradation = Math.min(100, Math.max(0, 100 - privacyRisk * (year - 2020) * 15))
      const recovery = year >= 2025 ? Math.min(60, (year - 2025) * 12) : 0
      return {
        year,
        signalLoss: parseFloat(degradation.toFixed(1)),
        signalRecovery: parseFloat(recovery.toFixed(1)),
      }
    })
  }, [privacyRisk])

  // Risk distribution
  const riskDistribution = useMemo(() => {
    const revenue2030 = forecastData.find((d) => d.year === 2030)?.total || 0
    const volatility = 0.08 * (1 + competitiveIntensity)
    const samples = generateMonteCarlo(revenue2030, volatility)

    const bins = []
    const min = Math.floor(samples[0] / 10) * 10
    const max = Math.ceil(samples[samples.length - 1] / 10) * 10

    for (let i = min; i < max; i += 20) {
      const count = samples.filter((s) => s >= i && s < i + 20).length
      bins.push({
        range: `$${i}-${i + 20}B`,
        count: (count / samples.length) * 100,
        value: i + 10,
      })
    }

    const p10 = samples[Math.floor(samples.length * 0.1)]
    const p50 = samples[Math.floor(samples.length * 0.5)]
    const p90 = samples[Math.floor(samples.length * 0.9)]

    return { bins, p10, p50, p90 }
  }, [forecastData, competitiveIntensity])

  // Sensitivity analysis
  const sensitivityData = useMemo(() => {
    const base2030 = forecastData.find((d) => d.year === 2030)?.total || 0

    const scenarios = [
      { param: "AI Adoption", low: base2030 * 0.85, high: base2030 * 1.15 },
      { param: "TAM Growth", low: base2030 * 0.90, high: base2030 * 1.12 },
      { param: "Cannibalization", low: base2030 * 1.08, high: base2030 * 0.92 },
      { param: "Competitive Intensity", low: base2030 * 0.94, high: base2030 * 1.06 },
      { param: "Privacy Impact", low: base2030 * 0.88, high: base2030 * 1.10 },
    ]

    return scenarios.map((s) => ({
      param: s.param,
      low: parseFloat(s.low.toFixed(1)),
      high: parseFloat(s.high.toFixed(1)),
      range: parseFloat((s.high - s.low).toFixed(1)),
    }))
  }, [forecastData])

  // Scenario comparison
  const scenarioComparison = useMemo(() => {
    const baseRev = forecastData.find((d) => d.year === 2030)?.total || 0
    return [
      { metric: "2030 Revenue", bull: baseRev * 1.18, base: baseRev, bear: baseRev * 0.78 },
      { metric: "5yr CAGR %", bull: 14.2, base: 11.8, bear: 8.5 },
      { metric: "AI Revenue %", bull: 42, base: 32, bear: 22 },
      { metric: "Market Share %", bull: 28.5, base: 24.1, bear: 19.8 },
    ]
  }, [forecastData])

  const revenue2030 = forecastData.find((d) => d.year === 2030)
  const cagr = revenue2030 ? Math.pow(revenue2030.total / HISTORICAL[2024], 1 / 6) - 1 : 0
  const integrityScore = Math.max(20, 100 - privacyRisk * 80)

  return (
    <div style={{ backgroundColor: COLORS.bg, color: COLORS.text }} className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <Brain size={40} color={COLORS.accent} />
            <h1 className="text-5xl font-bold">Revenue Horizon</h1>
          </div>
          <p className="text-xl text-slate-400">5-Year AI-Driven Revenue Forecasting for Digital Advertising</p>
          <p className="text-sm text-slate-500 mt-2">Executive Dashboard | {new Date().toLocaleDateString()}</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto border-b" style={{ borderBottomColor: COLORS.card }}>
          {["Summary", "Market", "AI Impact", "Privacy", "Risk", "Config"].map((tab, idx) => (
            <button
              key={idx}
              onClick={() => setActiveTab(idx)}
              className="px-6 py-3 font-semibold transition whitespace-nowrap"
              style={{
                backgroundColor: activeTab === idx ? COLORS.accent : "transparent",
                color: activeTab === idx ? "#000" : COLORS.muted,
                borderBottomWidth: activeTab === idx ? 0 : 2,
                borderBottomColor: activeTab === idx ? COLORS.accent : "transparent",
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab 0: Executive Summary */}
        {activeTab === 0 && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-4 gap-6">
              {[
                { label: "2030 Revenue", value: formatCurrency(revenue2030?.total || 0), icon: TrendingUp },
                { label: "AI Revenue %", value: formatPercent(revenue2030?.aiPercent || 0), icon: Brain },
                { label: "5-Year CAGR", value: `${(cagr * 100).toFixed(1)}%`, icon: Target },
                { label: "Market Share", value: `${marketData[10]?.marketShare.toFixed(1)}%` || "N/A", icon: Globe },
              ].map((metric, i) => {
                const Icon = metric.icon
                return (
                  <div key={i} style={{ backgroundColor: COLORS.card }} className="p-8 rounded-lg border border-slate-700">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-slate-400 text-sm font-semibold">{metric.label}</p>
                      <Icon size={20} color={COLORS.accent} />
                    </div>
                    <p className="text-4xl font-bold">{metric.value}</p>
                  </div>
                )
              })}
            </div>

            {/* 5-Year Revenue Chart */}
            <div style={{ backgroundColor: COLORS.card }} className="p-8 rounded-lg border border-slate-700">
              <h3 className="text-xl font-bold mb-6">5-Year Revenue Forecast</h3>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={forecastData}>
                  <defs>
                    <linearGradient id="colorTraditional" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0891B2" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#0891B2" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colorAI" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="year" stroke={COLORS.muted} />
                  <YAxis stroke={COLORS.muted} />
                  <Tooltip
                    contentStyle={{ backgroundColor: COLORS.card, border: `1px solid #334155`, borderRadius: 8 }}
                    formatter={(value) => `$${value.toFixed(1)}B`}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="traditional" stackId="1" stroke="#0891B2" fillOpacity={1} fill="url(#colorTraditional)" name="Traditional Revenue" />
                  <Area type="monotone" dataKey="ai" stackId="1" stroke="#10B981" fillOpacity={1} fill="url(#colorAI)" name="AI Revenue" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Revenue Split Donut */}
            <div className="grid grid-cols-2 gap-6">
              <div style={{ backgroundColor: COLORS.card }} className="p-8 rounded-lg border border-slate-700">
                <h3 className="text-lg font-bold mb-6">2030 Revenue Split</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Traditional", value: revenue2030?.traditional || 0, fill: "#0891B2" },
                        { name: "AI", value: revenue2030?.ai || 0, fill: "#10B981" },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: $${value.toFixed(1)}B`}
                    >
                      <Cell fill="#0891B2" />
                      <Cell fill="#10B981" />
                    </Pie>
                    <Tooltip formatter={(value) => `$${value.toFixed(1)}B`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div style={{ backgroundColor: COLORS.card }} className="p-8 rounded-lg border border-slate-700">
                <h3 className="text-lg font-bold mb-6">Market Position</h3>
                <div className="space-y-6">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-slate-400">TAM 2030</span>
                      <span className="font-bold">${(marketData[10]?.tam || 0).toFixed(1)}T</span>
                    </div>
                    <div style={{ backgroundColor: COLORS.bg }} className="h-3 rounded-full overflow-hidden">
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          backgroundColor: COLORS.muted,
                          opacity: 0.3,
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm text-slate-400">Company Revenue</span>
                      <span className="font-bold">${(revenue2030?.total || 0).toFixed(1)}B</span>
                    </div>
                    <div style={{ backgroundColor: COLORS.bg }} className="h-3 rounded-full overflow-hidden">
                      <div
                        style={{
                          width: `${((revenue2030?.total || 0) / (marketData[10]?.tam || 1)) * 100}%`,
                          height: "100%",
                          backgroundColor: COLORS.accent,
                        }}
                      />
                    </div>
                  </div>
                  <div className="pt-4 border-t border-slate-700">
                    <p className="text-sm text-slate-400 mb-2">Market Share Trajectory</p>
                    <p className="text-2xl font-bold text-green-400">
                      {marketData[10]?.marketShare.toFixed(1)}% (2030)
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      +{(marketData[10]?.marketShare - marketData[4]?.marketShare).toFixed(1)}pp from 2024
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 1: Market & Share */}
        {activeTab === 1 && (
          <div className="space-y-8">
            {/* TAM Projection */}
            <div style={{ backgroundColor: COLORS.card }} className="p-8 rounded-lg border border-slate-700">
              <h3 className="text-xl font-bold mb-6">Market TAM & Share Evolution</h3>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={marketData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="year" stroke={COLORS.muted} />
                  <YAxis yAxisId="left" stroke={COLORS.muted} />
                  <YAxis yAxisId="right" orientation="right" stroke={COLORS.muted} />
                  <Tooltip contentStyle={{ backgroundColor: COLORS.card, border: `1px solid #334155` }} />
                  <Legend />
                  <Line yAxisId="left" type="monotone" dataKey="tam" stroke="#0891B2" strokeWidth={2} name="TAM ($B)" dot={{ r: 4 }} />
                  <Line yAxisId="right" type="monotone" dataKey="marketShare" stroke="#10B981" strokeWidth={2} name="Market Share (%)" dot={{ r: 4 }} />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            {/* Format Mix */}
            <div style={{ backgroundColor: COLORS.card }} className="p-8 rounded-lg border border-slate-700">
              <h3 className="text-xl font-bold mb-6">Format Mix Evolution (% of Revenue)</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={formatMixData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke={COLORS.muted} />
                  <YAxis stroke={COLORS.muted} />
                  <Tooltip contentStyle={{ backgroundColor: COLORS.card, border: `1px solid #334155` }} />
                  <Legend />
                  <Bar dataKey="2025" stackId="a" fill="#0891B2" />
                  <Bar dataKey="2027" stackId="a" fill="#06B6D4" />
                  <Bar dataKey="2030" stackId="a" fill="#22D3EE" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab 2: AI Impact Analysis */}
        {activeTab === 2 && (
          <div className="space-y-8">
            {/* AI Channel Cards */}
            <div className="grid grid-cols-2 gap-6">
              {Object.entries(AI_CHANNELS).map(([key, channel]) => {
                const latest = aiAdoptionData[aiAdoptionData.length - 1][key] || 0
                const adoption = (latest / channel.ceiling) * 100
                return (
                  <div key={key} style={{ backgroundColor: COLORS.card }} className="p-6 rounded-lg border border-slate-700">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="font-bold">{channel.label}</h4>
                      <div style={{ color: channel.color }}>
                        <Brain size={18} />
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-slate-400">Adoption</span>
                          <span className="font-bold">{adoption.toFixed(1)}%</span>
                        </div>
                        <div style={{ backgroundColor: COLORS.bg }} className="h-2 rounded-full overflow-hidden">
                          <div
                            style={{
                              width: `${Math.min(adoption, 100)}%`,
                              height: "100%",
                              backgroundColor: channel.color,
                            }}
                          />
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-400">2030 Revenue</span>
                        <span className="font-bold">${(latest * 0.8).toFixed(1)}B</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* AI Adoption S-Curves */}
            <div style={{ backgroundColor: COLORS.card }} className="p-8 rounded-lg border border-slate-700">
              <h3 className="text-xl font-bold mb-6">AI Channel Adoption S-Curves</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={aiAdoptionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="year" stroke={COLORS.muted} />
                  <YAxis stroke={COLORS.muted} label={{ value: "Adoption ($B)", angle: -90, position: "insideLeft" }} />
                  <Tooltip contentStyle={{ backgroundColor: COLORS.card, border: `1px solid #334155` }} formatter={(value) => `$${value.toFixed(1)}B`} />
                  <Legend />
                  {Object.entries(AI_CHANNELS).map(([key, channel]) => (
                    <Line key={key} type="monotone" dataKey={key} stroke={channel.color} strokeWidth={2} dot={false} name={channel.label} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Cannibalization Matrix */}
            <div style={{ backgroundColor: COLORS.card }} className="p-8 rounded-lg border border-slate-700">
              <h3 className="text-xl font-bold mb-6">Channel Cannibalization Matrix (%)</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottomColor: COLORS.bg }}>
                      <th className="text-left p-4">Channel</th>
                      <th className="text-center p-4">Direct</th>
                      <th className="text-center p-4">Social</th>
                      <th className="text-center p-4">Retail</th>
                      <th className="text-center p-4">CTV</th>
                    </tr>
                  </thead>
                  <tbody>
                    {cannibalizationMatrix.map((row) => (
                      <tr key={row.channel} style={{ borderBottomColor: COLORS.bg }}>
                        <td className="p-4 font-semibold">{row.channel}</td>
                        <td className="text-center p-4">
                          <span
                            style={{
                              backgroundColor: `rgba(239, 68, 68, ${row.direct / 20})`,
                              padding: "4px 8px",
                              borderRadius: 4,
                            }}
                          >
                            {row.direct}%
                          </span>
                        </td>
                        <td className="text-center p-4">
                          <span
                            style={{
                              backgroundColor: `rgba(251, 146, 60, ${row.social / 20})`,
                              padding: "4px 8px",
                              borderRadius: 4,
                            }}
                          >
                            {row.social}%
                          </span>
                        </td>
                        <td className="text-center p-4">
                          <span
                            style={{
                              backgroundColor: `rgba(59, 130, 246, ${row.retail / 20})`,
                              padding: "4px 8px",
                              borderRadius: 4,
                            }}
                          >
                            {row.retail}%
                          </span>
                        </td>
                        <td className="text-center p-4">
                          <span
                            style={{
                              backgroundColor: `rgba(139, 92, 246, ${row.ctv / 20})`,
                              padding: "4px 8px",
                              borderRadius: 4,
                            }}
                          >
                            {row.ctv}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Net Incremental Waterfall */}
            <div style={{ backgroundColor: COLORS.card }} className="p-8 rounded-lg border border-slate-700">
              <h3 className="text-xl font-bold mb-6">Net Incremental AI Revenue Waterfall</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={[
                    { stage: "Gross AI", value: 65, fill: "#10B981" },
                    { stage: "Cannibalization", value: -12, fill: "#EF4444" },
                    { stage: "Net Incremental", value: 53, fill: "#0891B2" },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="stage" stroke={COLORS.muted} />
                  <YAxis stroke={COLORS.muted} label={{ value: "Revenue Impact ($B)", angle: -90, position: "insideLeft" }} />
                  <Tooltip contentStyle={{ backgroundColor: COLORS.card, border: `1px solid #334155` }} formatter={(value) => `$${Math.abs(value).toFixed(1)}B`} />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} shape={<CustomWaterfallBar />} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab 3: Privacy & Integrity */}
        {activeTab === 3 && (
          <div className="space-y-8">
            {/* Privacy Timeline */}
            <div style={{ backgroundColor: COLORS.card }} className="p-8 rounded-lg border border-slate-700">
              <h3 className="text-xl font-bold mb-6">Signal Loss & Recovery Timeline</h3>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={privacyData}>
                  <defs>
                    <linearGradient id="loss" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="recovery" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="year" stroke={COLORS.muted} />
                  <YAxis stroke={COLORS.muted} label={{ value: "Signal Availability (%)", angle: -90, position: "insideLeft" }} />
                  <Tooltip contentStyle={{ backgroundColor: COLORS.card, border: `1px solid #334155` }} formatter={(value) => `${value.toFixed(1)}%`} />
                  <Legend />
                  <Area type="monotone" dataKey="signalLoss" fill="url(#loss)" stroke="#EF4444" name="Signal Loss" />
                  <Area type="monotone" dataKey="signalRecovery" fill="url(#recovery)" stroke="#10B981" name="Recovery" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Regional Privacy Impact */}
            <div style={{ backgroundColor: COLORS.card }} className="p-8 rounded-lg border border-slate-700">
              <h3 className="text-xl font-bold mb-6">Privacy Multiplier by Region</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={[
                    { region: "US", "2024": 1.0, "2027": 0.92, "2030": 0.88, fill: "#0891B2" },
                    { region: "EU", "2024": 0.75, "2027": 0.68, "2030": 0.65, fill: "#06B6D4" },
                    { region: "APAC", "2024": 0.95, "2027": 0.88, "2030": 0.82, fill: "#22D3EE" },
                    { region: "RoW", "2024": 0.98, "2027": 0.94, "2030": 0.91, fill: "#F59E0B" },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="region" stroke={COLORS.muted} />
                  <YAxis stroke={COLORS.muted} label={{ value: "Effectiveness Multiplier", angle: -90, position: "insideLeft" }} />
                  <Tooltip contentStyle={{ backgroundColor: COLORS.card, border: `1px solid #334155` }} />
                  <Legend />
                  <Bar dataKey="2024" fill="#0891B2" />
                  <Bar dataKey="2027" fill="#06B6D4" />
                  <Bar dataKey="2030" fill="#22D3EE" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Integrity Health & Brand Safety */}
            <div className="grid grid-cols-2 gap-6">
              <div style={{ backgroundColor: COLORS.card }} className="p-8 rounded-lg border border-slate-700 flex flex-col items-center justify-center">
                <h3 className="text-lg font-bold mb-6">Integrity Health Score</h3>
                <div style={{ position: "relative", width: 200, height: 200 }}>
                  <svg viewBox="0 0 200 200" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="100" cy="100" r="90" fill="none" stroke="#334155" strokeWidth="20" />
                    <circle
                      cx="100"
                      cy="100"
                      r="90"
                      fill="none"
                      stroke={integrityScore > 70 ? "#10B981" : "#F59E0B"}
                      strokeWidth="20"
                      strokeDasharray={`${(integrityScore / 100) * 565} 565`}
                    />
                  </svg>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span className="text-4xl font-bold">{integrityScore.toFixed(0)}</span>
                    <span className="text-sm text-slate-400">/ 100</span>
                  </div>
                </div>
                <p className={`mt-4 text-sm font-semibold ${integrityScore > 70 ? "text-green-400" : "text-yellow-400"}`}>
                  {integrityScore > 70 ? "Healthy" : "At Risk"}
                </p>
              </div>

              <div style={{ backgroundColor: COLORS.card }} className="p-8 rounded-lg border border-slate-700">
                <h3 className="text-lg font-bold mb-6">Brand Safety Incidents</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={[
                      { year: 2022, incidents: 45 },
                      { year: 2023, incidents: 38 },
                      { year: 2024, incidents: 32 },
                      { year: 2025, incidents: 28 },
                      { year: 2026, incidents: 22 },
                      { year: 2027, incidents: 18 },
                      { year: 2028, incidents: 15 },
                      { year: 2029, incidents: 12 },
                      { year: 2030, incidents: 10 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="year" stroke={COLORS.muted} />
                    <YAxis stroke={COLORS.muted} />
                    <Tooltip contentStyle={{ backgroundColor: COLORS.card, border: `1px solid #334155` }} />
                    <Line type="monotone" dataKey="incidents" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Risk & Sensitivity */}
        {activeTab === 4 && (
          <div className="space-y-8">
            {/* Monte Carlo Distribution */}
            <div style={{ backgroundColor: COLORS.card }} className="p-8 rounded-lg border border-slate-700">
              <h3 className="text-xl font-bold mb-6">2030 Revenue Distribution (Monte Carlo)</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={riskDistribution.bins}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="range" stroke={COLORS.muted} />
                  <YAxis stroke={COLORS.muted} label={{ value: "Probability (%)", angle: -90, position: "insideLeft" }} />
                  <Tooltip contentStyle={{ backgroundColor: COLORS.card, border: `1px solid #334155` }} />
                  <Bar dataKey="count" fill="#0891B2" radius={[4, 4, 0, 0]} />
                  <ReferenceLine x={riskDistribution.p10} stroke="#EF4444" strokeDasharray="5 5" label={{ value: `P10: $${riskDistribution.p10.toFixed(0)}B`, position: "top" }} />
                  <ReferenceLine x={riskDistribution.p50} stroke="#F59E0B" strokeDasharray="5 5" label={{ value: `P50: $${riskDistribution.p50.toFixed(0)}B`, position: "top" }} />
                  <ReferenceLine x={riskDistribution.p90} stroke="#10B981" strokeDasharray="5 5" label={{ value: `P90: $${riskDistribution.p90.toFixed(0)}B`, position: "top" }} />
                </BarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center p-4" style={{ backgroundColor: COLORS.bg, borderRadius: 8 }}>
                  <p className="text-slate-400 text-sm mb-1">P10 (Pessimistic)</p>
                  <p className="text-2xl font-bold text-red-400">${riskDistribution.p10.toFixed(1)}B</p>
                </div>
                <div className="text-center p-4" style={{ backgroundColor: COLORS.bg, borderRadius: 8 }}>
                  <p className="text-slate-400 text-sm mb-1">P50 (Median)</p>
                  <p className="text-2xl font-bold text-yellow-400">${riskDistribution.p50.toFixed(1)}B</p>
                </div>
                <div className="text-center p-4" style={{ backgroundColor: COLORS.bg, borderRadius: 8 }}>
                  <p className="text-slate-400 text-sm mb-1">P90 (Optimistic)</p>
                  <p className="text-2xl font-bold text-green-400">${riskDistribution.p90.toFixed(1)}B</p>
                </div>
              </div>
            </div>

            {/* Sensitivity Tornado */}
            <div style={{ backgroundColor: COLORS.card }} className="p-8 rounded-lg border border-slate-700">
              <h3 className="text-xl font-bold mb-6">Sensitivity Analysis</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sensitivityData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke={COLORS.muted} label={{ value: "2030 Revenue Impact ($B)", angle: 0, position: "insideBottomRight", offset: -10 }} />
                  <YAxis type="category" dataKey="param" stroke={COLORS.muted} width={140} />
                  <Tooltip contentStyle={{ backgroundColor: COLORS.card, border: `1px solid #334155` }} formatter={(value) => `$${value.toFixed(1)}B`} />
                  <Bar dataKey="range" fill="#0891B2" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Scenario Comparison */}
            <div style={{ backgroundColor: COLORS.card }} className="p-8 rounded-lg border border-slate-700">
              <h3 className="text-xl font-bold mb-6">Scenario Comparison</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr style={{ borderBottomColor: COLORS.bg }}>
                      <th className="text-left p-4">Metric</th>
                      <th className="text-center p-4">Bull</th>
                      <th className="text-center p-4">Base</th>
                      <th className="text-center p-4">Bear</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scenarioComparison.map((row, i) => (
                      <tr key={i} style={{ borderBottomColor: COLORS.bg }}>
                        <td className="p-4 font-semibold">{row.metric}</td>
                        <td className="text-center p-4 text-green-400 font-bold">
                          {row.metric === "2030 Revenue" ? `$${row.bull.toFixed(1)}B` : row.bull % 1 !== 0 ? `${row.bull.toFixed(1)}%` : `${row.bull}%`}
                        </td>
                        <td className="text-center p-4 text-yellow-400 font-bold">
                          {row.metric === "2030 Revenue" ? `$${row.base.toFixed(1)}B` : row.base % 1 !== 0 ? `${row.base.toFixed(1)}%` : `${row.base}%`}
                        </td>
                        <td className="text-center p-4 text-red-400 font-bold">
                          {row.metric === "2030 Revenue" ? `$${row.bear.toFixed(1)}B` : row.bear % 1 !== 0 ? `${row.bear.toFixed(1)}%` : `${row.bear}%`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Configuration */}
        {activeTab === 5 && (
          <div className="space-y-8 max-w-2xl">
            {/* Scenario Buttons */}
            <div style={{ backgroundColor: COLORS.card }} className="p-8 rounded-lg border border-slate-700">
              <h3 className="text-lg font-bold mb-6">Scenario Selection</h3>
              <div className="flex gap-4">
                {[
                  { key: "bull", label: "Bull Case", desc: "Aggressive AI adoption" },
                  { key: "base", label: "Base Case", desc: "Moderate AI growth" },
                  { key: "bear", label: "Bear Case", desc: "Conservative outlook" },
                ].map((btn) => (
                  <button
                    key={btn.key}
                    onClick={() => applyScenario(btn.key)}
                    style={{
                      backgroundColor: scenario === btn.key ? COLORS.accent : COLORS.bg,
                      color: scenario === btn.key ? "#000" : COLORS.text,
                      borderColor: COLORS.accent,
                      borderWidth: 2,
                    }}
                    className="flex-1 p-4 rounded-lg font-bold transition"
                  >
                    <div>{btn.label}</div>
                    <div className="text-xs opacity-75 mt-1">{btn.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Master Controls */}
            <div style={{ backgroundColor: COLORS.card }} className="p-8 rounded-lg border border-slate-700 space-y-6">
              <h3 className="text-lg font-bold">Master Controls</h3>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-semibold text-sm">AI Revenue Target (%)</label>
                  <span className="text-sm font-bold text-cyan-400">{(aiRevenuePercent * 100).toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="50"
                  step="1"
                  value={aiRevenuePercent * 100}
                  onChange={(e) => setAiRevenuePercent(parseFloat(e.target.value) / 100)}
                  className="w-full cursor-pointer"
                  style={{ accentColor: COLORS.accent }}
                />
                <p className="text-xs text-slate-500 mt-2">Range: 0% - 50%</p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-semibold text-sm">TAM Annual Growth Rate</label>
                  <span className="text-sm font-bold text-cyan-400">{(tamGrowth * 100).toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="15"
                  step="0.1"
                  value={tamGrowth * 100}
                  onChange={(e) => setTamGrowth(parseFloat(e.target.value) / 100)}
                  className="w-full cursor-pointer"
                  style={{ accentColor: COLORS.accent }}
                />
                <p className="text-xs text-slate-500 mt-2">Range: 5% - 15%</p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-semibold text-sm">Cannibalization Rate</label>
                  <span className="text-sm font-bold text-cyan-400">{(cannibalization * 100).toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="35"
                  step="0.5"
                  value={cannibalization * 100}
                  onChange={(e) => setCannibalization(parseFloat(e.target.value) / 100)}
                  className="w-full cursor-pointer"
                  style={{ accentColor: COLORS.accent }}
                />
                <p className="text-xs text-slate-500 mt-2">Range: 5% - 35%</p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-semibold text-sm">Privacy Risk Severity</label>
                  <span className="text-sm font-bold text-cyan-400">{(privacyRisk * 100).toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="60"
                  step="0.5"
                  value={privacyRisk * 100}
                  onChange={(e) => setPrivacyRisk(parseFloat(e.target.value) / 100)}
                  className="w-full cursor-pointer"
                  style={{ accentColor: COLORS.accent }}
                />
                <p className="text-xs text-slate-500 mt-2">Range: 10% - 60%</p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="font-semibold text-sm">Competitive Intensity</label>
                  <span className="text-sm font-bold text-cyan-400">{(competitiveIntensity * 100).toFixed(1)}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="80"
                  step="1"
                  value={competitiveIntensity * 100}
                  onChange={(e) => setCompetitiveIntensity(parseFloat(e.target.value) / 100)}
                  className="w-full cursor-pointer"
                  style={{ accentColor: COLORS.accent }}
                />
                <p className="text-xs text-slate-500 mt-2">Range: 20% - 80%</p>
              </div>
            </div>

            {/* Regional Growth */}
            <div style={{ backgroundColor: COLORS.card }} className="p-8 rounded-lg border border-slate-700 space-y-4">
              <h3 className="text-lg font-bold mb-6">Regional Growth Rates</h3>
              {[
                { key: "us", label: "US" },
                { key: "eu", label: "Europe" },
                { key: "apac", label: "APAC" },
                { key: "row", label: "Rest of World" },
              ].map((region) => (
                <div key={region.key}>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-semibold text-sm">{region.label}</label>
                    <span className="text-sm font-bold text-cyan-400">{(regionalGrowth[region.key] * 100).toFixed(1)}%</span>
                  </div>
                  <input
                    type="range"
                    min="3"
                    max="20"
                    step="0.1"
                    value={regionalGrowth[region.key] * 100}
                    onChange={(e) => setRegionalGrowth({ ...regionalGrowth, [region.key]: parseFloat(e.target.value) / 100 })}
                    className="w-full cursor-pointer"
                    style={{ accentColor: COLORS.accent }}
                  />
                </div>
              ))}
            </div>

            {/* Reset Button */}
            <button
              onClick={() => {
                setAiRevenuePercent(0.32)
                setTamGrowth(0.09)
                setCannibalization(0.18)
                setPrivacyRisk(0.35)
                setCompetitiveIntensity(0.5)
                setRegionalGrowth({ us: 0.11, eu: 0.065, apac: 0.14, row: 0.08 })
                setScenario("base")
              }}
              style={{ backgroundColor: COLORS.accent, color: "#000" }}
              className="w-full py-3 rounded-lg font-bold transition hover:opacity-90"
            >
              Reset to Defaults
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

// Custom waterfall bar component
function CustomWaterfallBar(props) {
  const { x, y, width, height, payload } = props
  if (payload.value === undefined) return null

  const isNegative = payload.value < 0
  const barY = isNegative ? y : y + height - (Math.abs(payload.value) / 100) * height
  const barHeight = (Math.abs(payload.value) / 100) * height

  return <rect x={x} y={barY} width={width} height={barHeight} fill={payload.fill} rx={4} />
}
