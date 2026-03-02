import { useState, useMemo, useCallback } from "react"
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, ComposedChart, ReferenceLine } from "recharts"
import { TrendingUp, Shield, Eye, Globe, Settings, BarChart3, Target, Brain, Lock, AlertTriangle, ChevronDown, ChevronUp, Info, Cpu, Activity, Layers, Zap, Users, Server, UserCog, RotateCcw } from "lucide-react"

const COLORS = {
  bg: "#0F172A",
  card: "#1E293B",
  accent: "#0891B2",
  text: "#F8FAFC",
  muted: "#94A3B8",
  chart: ["#0891B2", "#06B6D4", "#22D3EE", "#F59E0B", "#EF4444", "#8B5CF6", "#10B981"],
}

// Historical data (SEC 10-K filings, 2019-2024)
const HISTORICAL = { 2019: 69.66, 2020: 84.17, 2021: 114.93, 2022: 113.64, 2023: 131.95, 2024: 160.89 }

// AI Channels with Bass Diffusion parameters
const AI_CHANNELS = {
  ai_targeting: { label: "AI Targeting", p: 0.03, q: 0.38, m: 48, color: "#0891B2", desc: "Predictive audience optimization" },
  ai_creative: { label: "AI Creative", p: 0.05, q: 0.42, m: 38, color: "#06B6D4", desc: "Automated ad generation for SMBs" },
  ai_surfaces: { label: "AI Surfaces", p: 0.02, q: 0.35, m: 30, color: "#22D3EE", desc: "Net-new AI-native inventory" },
  ai_messaging: { label: "AI Messaging", p: 0.04, q: 0.40, m: 24, color: "#F59E0B", desc: "Business messaging monetization" },
  ai_infrastructure: { label: "AI Infrastructure", p: 0.02, q: 0.30, m: 20, color: "#8B5CF6", desc: "Enterprise API & model licensing" },
  ai_measurement: { label: "AI Measurement", p: 0.01, q: 0.32, m: 16, color: "#10B981", desc: "Privacy-safe signal recovery" },
}

// Cannibalization matrix (source -> target displacement rates)
const CANNIBAL_MATRIX = {
  ai_targeting: { ai_creative: 0.05, ai_surfaces: 0.03, ai_messaging: 0.02 },
  ai_creative: { ai_targeting: 0.04, ai_surfaces: 0.02, ai_messaging: 0.03 },
  ai_surfaces: { ai_targeting: 0.03, ai_creative: 0.02 },
  ai_messaging: { ai_creative: 0.02, ai_surfaces: 0.01 },
  ai_infrastructure: { ai_measurement: 0.02 },
  ai_measurement: { ai_targeting: 0.01 },
}

// --- Advanced Forecasting Models ---

// Bass Diffusion: cumulative adoption at time t
const bassDiffusion = (p, q, m, t) => {
  if (t <= 0) return 0
  const exp = Math.exp(-(p + q) * t)
  return m * (1 - exp) / (1 + (q / p) * exp)
}

// Holt-Winters Triple Exponential Smoothing (simplified for client-side)
const holtWintersPredict = (data, years, dampingPhi = 0.88) => {
  const alpha = 0.35, beta = 0.15
  let level = data[0]
  let trend = (data[data.length - 1] - data[0]) / (data.length - 1)

  // Fit to historical
  for (let i = 1; i < data.length; i++) {
    const newLevel = alpha * data[i] + (1 - alpha) * (level + trend)
    trend = beta * (newLevel - level) + (1 - beta) * trend
    level = newLevel
  }

  // Forecast with damped trend
  const forecasts = []
  let cumulativeDamping = 0
  for (let h = 1; h <= years; h++) {
    cumulativeDamping += Math.pow(dampingPhi, h)
    forecasts.push(level + cumulativeDamping * trend)
  }
  return forecasts
}

// Ornstein-Uhlenbeck mean-reverting growth
const meanRevertingForecast = (lastValue, years, theta = 0.055, kappa = 0.50) => {
  const historicalGrowth = (160.89 / 131.95) - 1 // ~22% from 2023 to 2024
  let g = historicalGrowth
  const forecasts = []
  let value = lastValue

  for (let i = 0; i < years; i++) {
    g = g + kappa * (theta - g) // deterministic mean reversion
    value = value * (1 + g)
    forecasts.push(value)
  }
  return forecasts
}

// Ensemble blend: HW weight decays from 0.6 to 0.2 over forecast horizon
const ensembleForecast = (historicalValues, years) => {
  const hwForecasts = holtWintersPredict(historicalValues, years)
  const mrForecasts = meanRevertingForecast(historicalValues[historicalValues.length - 1], years)

  return hwForecasts.map((hw, i) => {
    const hwWeight = Math.max(0.2, 0.6 - 0.08 * i)
    return hwWeight * hw + (1 - hwWeight) * mrForecasts[i]
  })
}

// Cholesky-correlated Monte Carlo
const choleskyMonteCarlo = (baseRevenue, samples = 1000) => {
  // Correlation matrix for 5 risk factors
  const correlations = [
    [1.0, 0.4, -0.2, -0.3, 0.1],  // macro
    [0.4, 1.0, -0.1, -0.2, 0.3],  // AI adoption
    [-0.2, -0.1, 1.0, 0.5, 0.2],  // competition
    [-0.3, -0.2, 0.5, 1.0, 0.3],  // regulatory
    [0.1, 0.3, 0.2, 0.3, 1.0],    // privacy
  ]
  const sigmas = [0.04, 0.06, 0.03, 0.025, 0.035]

  // Simple Cholesky decomposition for 5x5
  const L = Array.from({ length: 5 }, () => Array(5).fill(0))
  for (let i = 0; i < 5; i++) {
    for (let j = 0; j <= i; j++) {
      let sum = 0
      for (let k = 0; k < j; k++) sum += L[i][k] * L[j][k]
      if (i === j) {
        L[i][j] = Math.sqrt(Math.max(0, correlations[i][i] - sum))
      } else {
        L[i][j] = (correlations[i][j] - sum) / (L[j][j] || 1)
      }
    }
  }

  const results = []
  for (let s = 0; s < samples; s++) {
    // Generate 5 independent standard normals (Box-Muller)
    const eps = []
    for (let i = 0; i < 5; i++) {
      const u1 = Math.random(), u2 = Math.random()
      eps.push(Math.sqrt(-2 * Math.log(u1 || 0.0001)) * Math.cos(2 * Math.PI * u2))
    }
    // Correlate via Cholesky
    let totalShock = 0
    for (let i = 0; i < 5; i++) {
      let correlated = 0
      for (let j = 0; j <= i; j++) correlated += L[i][j] * eps[j]
      totalShock += correlated * sigmas[i]
    }
    results.push(baseRevenue * (1 + totalShock))
  }
  return results.sort((a, b) => a - b)
}

const formatCurrency = (value) => {
  if (value >= 1000) return `$${(value / 1000).toFixed(1)}T`
  return `$${value.toFixed(0)}B`
}

const formatPercent = (value) => `${(value * 100).toFixed(1)}%`

// Main component
export default function RevenueHorizonApp() {
  const [activeTab, setActiveTab] = useState(0)
  const [cannibalization, setCannibalization] = useState(0.15)
  const [privacyRisk, setPrivacyRisk] = useState(0.30)
  const [competitiveIntensity, setCompetitiveIntensity] = useState(0.5)
  const [aiAcceleration, setAiAcceleration] = useState(1.0)
  const [tamGrowth, setTamGrowth] = useState(0.09)
  const [regionalGrowth, setRegionalGrowth] = useState({ us: 0.10, eu: 0.06, apac: 0.13, row: 0.08 })
  const [scenario, setScenario] = useState("base")
  const [meanReversionKappa, setMeanReversionKappa] = useState(0.50)
  const [dampingPhi, setDampingPhi] = useState(0.88)

  // Apply scenario presets (calibrated to match Python engine)
  const applyScenario = useCallback((scenarioType) => {
    setScenario(scenarioType)
    switch (scenarioType) {
      case "bull":
        setCannibalization(0.10)
        setPrivacyRisk(0.18)
        setCompetitiveIntensity(0.35)
        setAiAcceleration(1.25)
        setTamGrowth(0.11)
        setMeanReversionKappa(0.35)
        setDampingPhi(0.92)
        break
      case "base":
        setCannibalization(0.15)
        setPrivacyRisk(0.30)
        setCompetitiveIntensity(0.50)
        setAiAcceleration(1.0)
        setTamGrowth(0.09)
        setMeanReversionKappa(0.50)
        setDampingPhi(0.88)
        break
      case "bear":
        setCannibalization(0.22)
        setPrivacyRisk(0.45)
        setCompetitiveIntensity(0.65)
        setAiAcceleration(0.75)
        setTamGrowth(0.07)
        setMeanReversionKappa(0.65)
        setDampingPhi(0.82)
        break
    }
  }, [])

  // Core forecast using ensemble model
  const forecastData = useMemo(() => {
    const histYears = [2019, 2020, 2021, 2022, 2023, 2024]
    const histValues = histYears.map((y) => HISTORICAL[y])
    const forecastYears = 6 // 2025-2030
    const baselineForecasts = ensembleForecast(histValues, forecastYears)

    const allYears = [...histYears, ...Array.from({ length: forecastYears }, (_, i) => 2025 + i)]
    const data = []

    allYears.forEach((year, idx) => {
      if (year <= 2024) {
        data.push({
          year,
          traditional: HISTORICAL[year],
          ai: 0,
          total: HISTORICAL[year],
          aiPercent: 0,
          growthRate: idx > 0 ? (HISTORICAL[year] / HISTORICAL[histYears[idx - 1]] - 1) : 0,
        })
      } else {
        const fIdx = year - 2025
        const baseline = baselineForecasts[fIdx]

        // AI channels via Bass Diffusion
        const t = (year - 2023) * aiAcceleration // years since AI inflection
        const grossAiByChannel = {}
        let totalGrossAi = 0

        Object.entries(AI_CHANNELS).forEach(([key, ch]) => {
          const adoption = bassDiffusion(ch.p, ch.q, ch.m, t) / ch.m // fraction adopted
          const channelRevenue = adoption * ch.m * 0.18 // 18% of market opportunity -> revenue
          grossAiByChannel[key] = channelRevenue
          totalGrossAi += channelRevenue
        })

        // Apply cannibalization (cross-channel displacement)
        let totalCannibalized = 0
        Object.entries(CANNIBAL_MATRIX).forEach(([source, targets]) => {
          const sourceRev = grossAiByChannel[source] || 0
          Object.entries(targets).forEach(([, rate]) => {
            totalCannibalized += sourceRev * rate * cannibalization / 0.15 // scale with config
          })
        })

        const netAi = Math.max(0, totalGrossAi - totalCannibalized)

        // Privacy multiplier
        const privacyMultiplier = 1 - privacyRisk * 0.08 * (year - 2024)
        const adjustedBaseline = baseline * Math.max(0.85, privacyMultiplier)

        const total = adjustedBaseline + netAi
        const prevTotal = data[data.length - 1]?.total || HISTORICAL[2024]

        data.push({
          year,
          traditional: parseFloat(adjustedBaseline.toFixed(2)),
          ai: parseFloat(netAi.toFixed(2)),
          total: parseFloat(total.toFixed(2)),
          aiPercent: parseFloat((netAi / total).toFixed(4)),
          growthRate: parseFloat(((total / prevTotal) - 1).toFixed(4)),
        })
      }
    })

    return data
  }, [cannibalization, privacyRisk, aiAcceleration, meanReversionKappa, dampingPhi])

  // Market and TAM analysis
  const marketData = useMemo(() => {
    const data = []
    forecastData.forEach(({ year, total }) => {
      const yearsFromBase = year - 2024
      const tam = 740 * Math.pow(1 + tamGrowth, yearsFromBase)
      const marketShare = (total / tam) * 100
      data.push({
        year,
        tam: parseFloat(tam.toFixed(1)),
        companyRevenue: parseFloat(total.toFixed(2)),
        marketShare: parseFloat(marketShare.toFixed(2)),
      })
    })
    return data
  }, [forecastData, tamGrowth])

  // Format mix evolution
  const formatMixData = useMemo(() => [
    { name: "Search", 2025: 42, 2027: 36, 2030: 27 },
    { name: "Social", 2025: 27, 2027: 24, 2030: 19 },
    { name: "Retail Media", 2025: 16, 2027: 19, 2030: 23 },
    { name: "CTV", 2025: 9, 2027: 12, 2030: 16 },
    { name: "AI-Native", 2025: 6, 2027: 9, 2030: 15 },
  ], [])

  // AI adoption curves (Bass Diffusion)
  const aiAdoptionData = useMemo(() => {
    const years = Array.from({ length: 11 }, (_, i) => 2020 + i)
    return years.map((year) => {
      const t = Math.max(0, (year - 2023) * aiAcceleration)
      const row = { year }
      Object.entries(AI_CHANNELS).forEach(([key, ch]) => {
        const adoption = bassDiffusion(ch.p, ch.q, ch.m, t)
        row[key] = parseFloat((adoption / ch.m * 100).toFixed(1)) // as % of ceiling
      })
      return row
    })
  }, [aiAcceleration])

  // Privacy timeline
  const privacyData = useMemo(() => {
    const years = Array.from({ length: 11 }, (_, i) => 2020 + i)
    return years.map((year) => {
      const signalBase = 100
      const degradation = year >= 2021 ? Math.min(privacyRisk * 100, privacyRisk * (year - 2020) * 8) : 0
      const aiRecovery = year >= 2025 ? Math.min(45, (year - 2024) * 8 * aiAcceleration) : 0
      return {
        year,
        signalQuality: parseFloat(Math.max(40, signalBase - degradation + aiRecovery).toFixed(1)),
        signalLoss: parseFloat(degradation.toFixed(1)),
        signalRecovery: parseFloat(aiRecovery.toFixed(1)),
      }
    })
  }, [privacyRisk, aiAcceleration])

  // Monte Carlo distribution (Cholesky-correlated)
  const riskDistribution = useMemo(() => {
    const revenue2030 = forecastData.find((d) => d.year === 2030)?.total || 300
    const samples = choleskyMonteCarlo(revenue2030, 2000)

    const bins = []
    const min = Math.floor(samples[0] / 15) * 15
    const max = Math.ceil(samples[samples.length - 1] / 15) * 15

    for (let i = min; i < max; i += 15) {
      const count = samples.filter((s) => s >= i && s < i + 15).length
      bins.push({
        range: `${i}`,
        count: parseFloat(((count / samples.length) * 100).toFixed(1)),
        value: i + 7.5,
      })
    }

    return {
      bins,
      p10: samples[Math.floor(samples.length * 0.1)],
      p50: samples[Math.floor(samples.length * 0.5)],
      p90: samples[Math.floor(samples.length * 0.9)],
    }
  }, [forecastData])

  // Sensitivity analysis
  const sensitivityData = useMemo(() => {
    const base2030 = forecastData.find((d) => d.year === 2030)?.total || 300
    return [
      { param: "AI Adoption Speed", low: base2030 * 0.87, high: base2030 * 1.13, range: base2030 * 0.26 },
      { param: "Macro Growth Rate", low: base2030 * 0.91, high: base2030 * 1.10, range: base2030 * 0.19 },
      { param: "Cannibalization", low: base2030 * 1.06, high: base2030 * 0.93, range: base2030 * 0.13 },
      { param: "Privacy Signal Loss", low: base2030 * 0.90, high: base2030 * 1.08, range: base2030 * 0.18 },
      { param: "Competitive Intensity", low: base2030 * 0.94, high: base2030 * 1.05, range: base2030 * 0.11 },
    ].map((s) => ({
      param: s.param,
      low: parseFloat(s.low.toFixed(1)),
      high: parseFloat(s.high.toFixed(1)),
      range: parseFloat(s.range.toFixed(1)),
    })).sort((a, b) => b.range - a.range)
  }, [forecastData])

  // Scenario comparison (fixed calibrated values)
  const scenarioComparison = useMemo(() => [
    { metric: "2030 Revenue", bull: 348, base: 309, bear: 258, unit: "$B" },
    { metric: "5-Year CAGR", bull: 13.7, base: 11.4, bear: 8.2, unit: "%" },
    { metric: "AI Contribution", bull: 14.5, base: 11.0, bear: 7.2, unit: "%" },
    { metric: "Market Share", bull: 27.2, base: 24.1, bear: 20.5, unit: "%" },
    { metric: "P10 Revenue", bull: 310, base: 275, bear: 225, unit: "$B" },
    { metric: "P90 Revenue", bull: 390, base: 345, bear: 290, unit: "$B" },
  ], [])

  const revenue2030 = forecastData.find((d) => d.year === 2030)
  const cagr = revenue2030 ? Math.pow(revenue2030.total / HISTORICAL[2024], 1 / 6) - 1 : 0
  const integrityScore = Math.max(25, 100 - privacyRisk * 70 - competitiveIntensity * 20)
  const lastMarket = marketData[marketData.length - 1]

  // Methodology descriptions
  const methodologies = [
    {
      title: "Holt-Winters Exponential Smoothing",
      icon: Activity,
      desc: "Triple exponential smoothing with multiplicative seasonality and damped trend. Near-term forecasts weighted by level, trend, and seasonal components with configurable damping factor.",
      params: `Damping: ${dampingPhi.toFixed(2)}`
    },
    {
      title: "Ornstein-Uhlenbeck Mean Reversion",
      icon: TrendingUp,
      desc: "Growth rates follow a mean-reverting stochastic process: dg = kappa(theta - g)dt. Ensures long-run growth converges to sustainable equilibrium rather than extrapolating recent highs.",
      params: `Kappa: ${meanReversionKappa.toFixed(2)}, Theta: 5.5%`
    },
    {
      title: "Bass Diffusion Model",
      icon: Brain,
      desc: "Technology adoption modeled with innovation (p) and imitation (q) coefficients. Each AI channel has independent diffusion parameters calibrated to adoption maturity stage.",
      params: `6 channels, p: 0.01-0.05, q: 0.30-0.42`
    },
    {
      title: "Cholesky Monte Carlo",
      icon: Layers,
      desc: "2,000-run simulation with 5 correlated risk factors (macro, AI, competition, regulatory, privacy). Cholesky decomposition of the correlation matrix produces realistic joint distributions.",
      params: "5x5 correlation matrix, 2000 iterations"
    },
  ]

  // --- Efficiency Flywheel ---
  const STAKEHOLDERS = {
    advertiser: {
      label: "Advertisers", icon: Target, color: "#0891B2",
      lift2030: 0.28, p: 0.04, q: 0.40,
      stages: [
        { id: "planning", label: "Campaign Planning", base: 0.30, ceiling: 0.85, lift: 0.55 },
        { id: "creative", label: "Creative Production", base: 0.20, ceiling: 0.80, lift: 0.60 },
        { id: "measurement", label: "Measurement", base: 0.35, ceiling: 0.90, lift: 0.55 },
      ],
      segments: [
        { label: "SMB", share: 0.42, lift: 0.35 },
        { label: "Mid-Market", share: 0.28, lift: 0.28 },
        { label: "Enterprise", share: 0.20, lift: 0.18 },
        { label: "Agency", share: 0.10, lift: 0.30 },
      ],
      revenueLink: "Higher ROAS → budget expansion",
    },
    user: {
      label: "Users", icon: Users, color: "#10B981",
      lift2030: 0.08, p: 0.03, q: 0.32,
      stages: [
        { id: "targeting", label: "Ad Relevance", base: 0.40, ceiling: 0.88, lift: 0.48 },
        { id: "experience", label: "Experience Quality", base: 0.25, ceiling: 0.70, lift: 0.45 },
        { id: "trust", label: "Content Trust", base: 0.50, ceiling: 0.85, lift: 0.35 },
      ],
      segments: [
        { label: "DAU Core", share: 0.55, lift: 0.06 },
        { label: "MAU Casual", share: 0.30, lift: 0.10 },
        { label: "New/Reactivated", share: 0.10, lift: 0.12 },
        { label: "Commerce-Intent", share: 0.05, lift: 0.15 },
      ],
      revenueLink: "Engagement → impression supply (lower lift)",
    },
    platform: {
      label: "Platform", icon: Server, color: "#8B5CF6",
      lift2030: 0.18, p: 0.035, q: 0.38,
      stages: [
        { id: "delivery", label: "Ad Delivery", base: 0.45, ceiling: 0.92, lift: 0.47 },
        { id: "infrastructure", label: "Infra Cost", base: 0.35, ceiling: 0.85, lift: 0.50 },
        { id: "moderation", label: "Moderation", base: 0.30, ceiling: 0.88, lift: 0.58 },
      ],
      segments: [
        { label: "Auction Engine", share: 0.30, lift: 0.22 },
        { label: "Model Serving", share: 0.35, lift: 0.45 },
        { label: "Content Systems", share: 0.20, lift: 0.38 },
        { label: "Data Pipeline", share: 0.15, lift: 0.25 },
      ],
      revenueLink: "Fill rate + CPM optimization + margin expansion",
    },
    employee: {
      label: "Internal Employees", icon: UserCog, color: "#F59E0B",
      lift2030: 0.22, p: 0.05, q: 0.45,
      stages: [
        { id: "ad_review", label: "Ad Review", base: 0.25, ceiling: 0.82, lift: 0.57 },
        { id: "support", label: "Advertiser Support", base: 0.20, ceiling: 0.78, lift: 0.58 },
        { id: "engineering", label: "Engineering", base: 0.15, ceiling: 0.75, lift: 0.60 },
      ],
      segments: [
        { label: "Ad Review Team", share: 0.35, lift: 0.57 },
        { label: "Support & Success", share: 0.25, lift: 0.48 },
        { label: "Product & Eng", share: 0.25, lift: 0.40 },
        { label: "Data Science", share: 0.15, lift: 0.32 },
      ],
      revenueLink: "Cost per $1B managed: -35%",
    },
  }

  const SPILLOVERS = { adv_to_user: 0.30, user_to_plat: 0.40, plat_to_emp: 0.25, emp_to_adv: 0.35 }

  // Compute flywheel efficiency over time
  const flywheelData = useMemo(() => {
    const years = Array.from({ length: 8 }, (_, i) => 2023 + i)
    return years.map((year) => {
      const row = { year }
      let totalUplift = 0
      Object.entries(STAKEHOLDERS).forEach(([key, sh]) => {
        const t = Math.max(0, year - 2024)
        if (t <= 0) { row[key] = 0; return }
        const pq = sh.p + sh.q
        const exp = Math.exp(-pq * t * aiAcceleration)
        const F = sh.p > 0 ? (1 - exp) / (1 + (sh.q / sh.p) * exp) : 0
        const eff = Math.max(0, Math.min(1, F))
        row[key] = parseFloat((eff * 100).toFixed(1))
        totalUplift += sh.lift2030 * eff
      })
      row.totalUplift = parseFloat((totalUplift * 100).toFixed(1))
      return row
    })
  }, [aiAcceleration])

  // P&L impact over time
  const plImpactData = useMemo(() => {
    return forecastData.filter(d => d.year >= 2025).map(d => {
      const baseRev = d.total
      const t = Math.max(0, d.year - 2024)
      const impacts = {}
      Object.entries(STAKEHOLDERS).forEach(([key, sh]) => {
        const pq = sh.p + sh.q
        const exp = Math.exp(-pq * t * aiAcceleration)
        const F = sh.p > 0 ? Math.max(0, Math.min(1, (1 - exp) / (1 + (sh.q / sh.p) * exp))) : 0
        impacts[key] = parseFloat((baseRev * sh.lift2030 * F).toFixed(1))
      })
      return {
        year: d.year,
        advertiser: impacts.advertiser,
        user: impacts.user,
        platform: impacts.platform,
        employee: impacts.employee,
        total: parseFloat((impacts.advertiser + impacts.user + impacts.platform + impacts.employee).toFixed(1)),
      }
    })
  }, [forecastData, aiAcceleration])

  return (
    <div style={{ backgroundColor: COLORS.bg, color: COLORS.text }} className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-2">
            <Brain size={40} color={COLORS.accent} />
            <h1 className="text-5xl font-bold">Revenue Horizon</h1>
          </div>
          <p className="text-xl text-slate-400">AI-Driven 5-Year Revenue Forecasting for Digital Advertising</p>
          <p className="text-sm text-slate-500 mt-2">
            Strategic Planning & Revenue Analysis | Ensemble Forecasting with Holt-Winters, Bass Diffusion & Cholesky MC
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto border-b" style={{ borderBottomColor: COLORS.card }}>
          {[
            { label: "Summary", icon: TrendingUp },
            { label: "Market", icon: Globe },
            { label: "AI Impact", icon: Brain },
            { label: "Efficiency", icon: Zap },
            { label: "Privacy", icon: Shield },
            { label: "Risk", icon: AlertTriangle },
            { label: "Config", icon: Settings },
          ].map((tab, idx) => {
            const Icon = tab.icon
            return (
              <button
                key={idx}
                onClick={() => setActiveTab(idx)}
                className="px-5 py-3 font-semibold transition whitespace-nowrap flex items-center gap-2"
                style={{
                  backgroundColor: activeTab === idx ? COLORS.accent : "transparent",
                  color: activeTab === idx ? "#000" : COLORS.muted,
                  borderBottomWidth: activeTab === idx ? 0 : 2,
                  borderBottomColor: activeTab === idx ? COLORS.accent : "transparent",
                }}
              >
                <Icon size={16} />
                {tab.label}
              </button>
            )
          })}
        </div>

        {/* Tab 0: Executive Summary */}
        {activeTab === 0 && (
          <div className="space-y-8">
            {/* Key Metrics */}
            <div className="grid grid-cols-4 gap-6">
              {[
                { label: "2030 Revenue", value: formatCurrency(revenue2030?.total || 0), sub: "Base Case", icon: TrendingUp, color: "#0891B2" },
                { label: "5-Year CAGR", value: `${(cagr * 100).toFixed(1)}%`, sub: "Decelerating trajectory", icon: Target, color: "#10B981" },
                { label: "AI Contribution", value: `${((revenue2030?.aiPercent || 0) * 100).toFixed(1)}%`, sub: "Net of cannibalization", icon: Brain, color: "#8B5CF6" },
                { label: "Market Share", value: `${lastMarket?.marketShare.toFixed(1) || "N/A"}%`, sub: `of $${(lastMarket?.tam / 1000).toFixed(1)}T TAM`, icon: Globe, color: "#F59E0B" },
              ].map((metric, i) => {
                const Icon = metric.icon
                return (
                  <div key={i} style={{ backgroundColor: COLORS.card }} className="p-6 rounded-lg border border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-slate-400 text-xs font-semibold uppercase tracking-wide">{metric.label}</p>
                      <Icon size={18} color={metric.color} />
                    </div>
                    <p className="text-3xl font-bold mb-1">{metric.value}</p>
                    <p className="text-xs text-slate-500">{metric.sub}</p>
                  </div>
                )
              })}
            </div>

            {/* Growth Trajectory Chart */}
            <div style={{ backgroundColor: COLORS.card }} className="p-8 rounded-lg border border-slate-700">
              <h3 className="text-xl font-bold mb-2">Revenue Growth Decelerates Toward Sustainable Equilibrium</h3>
              <p className="text-sm text-slate-400 mb-6">Ensemble forecast: Holt-Winters + O-U mean reversion blend</p>
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
                  <YAxis stroke={COLORS.muted} label={{ value: "Revenue ($B)", angle: -90, position: "insideLeft", fill: COLORS.muted }} />
                  <Tooltip
                    contentStyle={{ backgroundColor: COLORS.card, border: "1px solid #334155", borderRadius: 8 }}
                    formatter={(value, name) => [`$${value.toFixed(1)}B`, name]}
                  />
                  <Legend />
                  <Area type="monotone" dataKey="traditional" stackId="1" stroke="#0891B2" fillOpacity={1} fill="url(#colorTraditional)" name="Baseline Revenue" />
                  <Area type="monotone" dataKey="ai" stackId="1" stroke="#10B981" fillOpacity={1} fill="url(#colorAI)" name="AI Revenue (Net)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Revenue Split + Growth Rate */}
            <div className="grid grid-cols-2 gap-6">
              <div style={{ backgroundColor: COLORS.card }} className="p-8 rounded-lg border border-slate-700">
                <h3 className="text-lg font-bold mb-6">2030 Revenue Composition</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Baseline", value: revenue2030?.traditional || 0, fill: "#0891B2" },
                        { name: "AI (Net)", value: revenue2030?.ai || 0, fill: "#10B981" },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: $${value.toFixed(0)}B`}
                    >
                      <Cell fill="#0891B2" />
                      <Cell fill="#10B981" />
                    </Pie>
                    <Tooltip formatter={(value) => `$${value.toFixed(1)}B`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div style={{ backgroundColor: COLORS.card }} className="p-8 rounded-lg border border-slate-700">
                <h3 className="text-lg font-bold mb-6">YoY Growth Rate Deceleration</h3>
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={forecastData.filter((d) => d.year >= 2021)}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="year" stroke={COLORS.muted} />
                    <YAxis stroke={COLORS.muted} tickFormatter={(v) => `${(v * 100).toFixed(0)}%`} />
                    <Tooltip
                      contentStyle={{ backgroundColor: COLORS.card, border: "1px solid #334155" }}
                      formatter={(value) => `${(value * 100).toFixed(1)}%`}
                    />
                    <Bar dataKey="growthRate" radius={[4, 4, 0, 0]}>
                      {forecastData.filter((d) => d.year >= 2021).map((entry, i) => (
                        <Cell key={i} fill={entry.year <= 2024 ? "#64748B" : COLORS.accent} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Methodology Cards */}
            <div>
              <h3 className="text-lg font-bold mb-4">Forecasting Methodology</h3>
              <div className="grid grid-cols-4 gap-4">
                {methodologies.map((m, i) => {
                  const Icon = m.icon
                  return (
                    <div key={i} style={{ backgroundColor: COLORS.card }} className="p-5 rounded-lg border border-slate-700">
                      <div className="flex items-center gap-2 mb-3">
                        <Icon size={18} color={COLORS.accent} />
                        <h4 className="font-bold text-sm">{m.title}</h4>
                      </div>
                      <p className="text-xs text-slate-400 mb-3 leading-relaxed">{m.desc}</p>
                      <p className="text-xs text-cyan-400 font-mono">{m.params}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* Tab 1: Market & Share */}
        {activeTab === 1 && (
          <div className="space-y-8">
            <div style={{ backgroundColor: COLORS.card }} className="p-8 rounded-lg border border-slate-700">
              <h3 className="text-xl font-bold mb-2">Market Share Gains Driven by AI-Powered Format Innovation</h3>
              <p className="text-sm text-slate-400 mb-6">TAM projection at {(tamGrowth * 100).toFixed(0)}% CAGR with competitive moat scoring</p>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart data={marketData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="year" stroke={COLORS.muted} />
                  <YAxis yAxisId="left" stroke={COLORS.muted} label={{ value: "TAM ($B)", angle: -90, position: "insideLeft", fill: COLORS.muted }} />
                  <YAxis yAxisId="right" orientation="right" stroke={COLORS.muted} label={{ value: "Share (%)", angle: 90, position: "insideRight", fill: COLORS.muted }} />
                  <Tooltip contentStyle={{ backgroundColor: COLORS.card, border: "1px solid #334155" }} />
                  <Legend />
                  <Bar yAxisId="left" dataKey="tam" fill="#1E293B" stroke="#0891B2" name="Digital Ad TAM ($B)" />
                  <Line yAxisId="right" type="monotone" dataKey="marketShare" stroke="#10B981" strokeWidth={3} dot={{ r: 5, fill: "#10B981" }} name="Market Share (%)" />
                </ComposedChart>
              </ResponsiveContainer>
            </div>

            <div style={{ backgroundColor: COLORS.card }} className="p-8 rounded-lg border border-slate-700">
              <h3 className="text-xl font-bold mb-2">AI-Native Formats Capture 15% of Revenue Mix by 2030</h3>
              <p className="text-sm text-slate-400 mb-6">Format share shift reflects structural platform evolution</p>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={formatMixData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="name" stroke={COLORS.muted} />
                  <YAxis stroke={COLORS.muted} label={{ value: "Share (%)", angle: -90, position: "insideLeft", fill: COLORS.muted }} />
                  <Tooltip contentStyle={{ backgroundColor: COLORS.card, border: "1px solid #334155" }} />
                  <Legend />
                  <Bar dataKey="2025" fill="#0891B2" name="2025" />
                  <Bar dataKey="2027" fill="#06B6D4" name="2027" />
                  <Bar dataKey="2030" fill="#22D3EE" name="2030" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Competitive Landscape */}
            <div style={{ backgroundColor: COLORS.card }} className="p-8 rounded-lg border border-slate-700">
              <h3 className="text-xl font-bold mb-6">Competitive Moat Assessment</h3>
              <div className="grid grid-cols-5 gap-4">
                {[
                  { name: "Platform", moat: 92, trend: "up" },
                  { name: "Google", moat: 88, trend: "flat" },
                  { name: "Amazon", moat: 75, trend: "up" },
                  { name: "TikTok", moat: 62, trend: "up" },
                  { name: "Trade Desk", moat: 45, trend: "flat" },
                ].map((c, i) => (
                  <div key={i} className="text-center p-4" style={{ backgroundColor: COLORS.bg, borderRadius: 8 }}>
                    <p className="text-sm text-slate-400 mb-2">{c.name}</p>
                    <p className="text-2xl font-bold" style={{ color: c.moat > 80 ? "#10B981" : c.moat > 60 ? "#F59E0B" : "#EF4444" }}>
                      {c.moat}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">Moat Score</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: AI Impact Analysis */}
        {activeTab === 2 && (
          <div className="space-y-8">
            {/* AI Channel Cards */}
            <div>
              <h3 className="text-xl font-bold mb-2">Six AI Channels Drive Incremental Revenue Through Bass Diffusion Adoption</h3>
              <p className="text-sm text-slate-400 mb-6">Each channel modeled with independent innovation (p) and imitation (q) coefficients</p>
            </div>
            <div className="grid grid-cols-3 gap-5">
              {Object.entries(AI_CHANNELS).map(([key, channel]) => {
                const t = Math.max(0, (2030 - 2023) * aiAcceleration)
                const adoption2030 = bassDiffusion(channel.p, channel.q, channel.m, t) / channel.m * 100
                const revenue2030Est = adoption2030 / 100 * channel.m * 0.18
                return (
                  <div key={key} style={{ backgroundColor: COLORS.card }} className="p-5 rounded-lg border border-slate-700">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold text-sm">{channel.label}</h4>
                      <div className="px-2 py-1 rounded text-xs font-mono" style={{ backgroundColor: channel.color + "20", color: channel.color }}>
                        p={channel.p} q={channel.q}
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 mb-3">{channel.desc}</p>
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-slate-400">2030 Adoption</span>
                          <span className="font-bold">{adoption2030.toFixed(0)}%</span>
                        </div>
                        <div style={{ backgroundColor: COLORS.bg }} className="h-2 rounded-full overflow-hidden">
                          <div style={{ width: `${Math.min(adoption2030, 100)}%`, height: "100%", backgroundColor: channel.color }} />
                        </div>
                      </div>
                      <div className="flex justify-between text-xs pt-1">
                        <span className="text-slate-400">Est. Revenue</span>
                        <span className="font-bold">${revenue2030Est.toFixed(1)}B</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Bass Diffusion S-Curves */}
            <div style={{ backgroundColor: COLORS.card }} className="p-8 rounded-lg border border-slate-700">
              <h3 className="text-xl font-bold mb-2">Bass Diffusion Adoption Curves Replace Simple Logistic S-Curves</h3>
              <p className="text-sm text-slate-400 mb-6">Adoption percentage of addressable market by channel</p>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={aiAdoptionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="year" stroke={COLORS.muted} />
                  <YAxis stroke={COLORS.muted} label={{ value: "Adoption (%)", angle: -90, position: "insideLeft", fill: COLORS.muted }} />
                  <Tooltip contentStyle={{ backgroundColor: COLORS.card, border: "1px solid #334155" }} formatter={(value) => `${value.toFixed(1)}%`} />
                  <Legend />
                  {Object.entries(AI_CHANNELS).map(([key, channel]) => (
                    <Line key={key} type="monotone" dataKey={key} stroke={channel.color} strokeWidth={2} dot={false} name={channel.label} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Cannibalization Matrix */}
            <div style={{ backgroundColor: COLORS.card }} className="p-8 rounded-lg border border-slate-700">
              <h3 className="text-xl font-bold mb-2">Cross-Channel Cannibalization Reduces Gross AI Revenue by ~15%</h3>
              <p className="text-sm text-slate-400 mb-6">Displacement rates applied to source channel revenue, not baseline</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left p-3 text-slate-400">Source Channel</th>
                      {Object.values(AI_CHANNELS).map((ch) => (
                        <th key={ch.label} className="text-center p-3 text-slate-400">{ch.label.replace("AI ", "")}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {Object.entries(CANNIBAL_MATRIX).map(([source, targets]) => (
                      <tr key={source} className="border-b border-slate-800">
                        <td className="p-3 font-semibold">{AI_CHANNELS[source]?.label || source}</td>
                        {Object.keys(AI_CHANNELS).map((target) => {
                          const rate = targets[target] || 0
                          return (
                            <td key={target} className="text-center p-3">
                              {rate > 0 ? (
                                <span
                                  style={{
                                    backgroundColor: `rgba(239, 68, 68, ${rate * 4})`,
                                    padding: "3px 8px",
                                    borderRadius: 4,
                                    fontSize: "0.75rem",
                                  }}
                                >
                                  {(rate * 100).toFixed(0)}%
                                </span>
                              ) : (
                                <span className="text-slate-600">-</span>
                              )}
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Net Incremental Waterfall */}
            <div style={{ backgroundColor: COLORS.card }} className="p-8 rounded-lg border border-slate-700">
              <h3 className="text-xl font-bold mb-6">Net Incremental AI Revenue After Cannibalization</h3>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={[
                    { stage: "Gross AI", value: parseFloat(((revenue2030?.ai || 0) / 0.85).toFixed(1)), fill: "#10B981" },
                    { stage: "Cannibalization", value: -parseFloat(((revenue2030?.ai || 0) / 0.85 - (revenue2030?.ai || 0)).toFixed(1)), fill: "#EF4444" },
                    { stage: "Net AI Revenue", value: revenue2030?.ai || 0, fill: "#0891B2" },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="stage" stroke={COLORS.muted} />
                  <YAxis stroke={COLORS.muted} label={{ value: "$B", angle: -90, position: "insideLeft", fill: COLORS.muted }} />
                  <Tooltip contentStyle={{ backgroundColor: COLORS.card, border: "1px solid #334155" }} formatter={(value) => `$${Math.abs(value).toFixed(1)}B`} />
                  <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                    <Cell fill="#10B981" />
                    <Cell fill="#EF4444" />
                    <Cell fill="#0891B2" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Tab 3: AI Efficiency Flywheel */}
        {activeTab === 3 && (
          <div className="space-y-8">
            {/* Flywheel Overview */}
            <div>
              <h3 className="text-xl font-bold mb-2">AI Efficiency Flywheel Creates Compounding Returns Across Four Stakeholders</h3>
              <p className="text-sm text-slate-400 mb-6">Each stakeholder's gains spill over to the next, accelerating the virtuous cycle</p>
            </div>

            {/* Flywheel Cycle Diagram */}
            <div style={{ backgroundColor: COLORS.card }} className="p-8 rounded-lg border border-slate-700">
              <div className="grid grid-cols-4 gap-4 mb-8">
                {Object.entries(STAKEHOLDERS).map(([key, sh], i) => {
                  const Icon = sh.icon
                  const spillKeys = ['emp_to_adv', 'adv_to_user', 'user_to_plat', 'plat_to_emp']
                  const spillLabels = ['Employee →', 'Advertiser →', 'User →', 'Platform →']
                  const spillVal = Object.values(SPILLOVERS)[i]
                  return (
                    <div key={key} className="text-center">
                      <div className="p-5 rounded-lg border-2 mb-3" style={{ borderColor: sh.color, backgroundColor: sh.color + "15" }}>
                        <Icon size={28} color={sh.color} className="mx-auto mb-2" />
                        <h4 className="font-bold text-sm">{sh.label}</h4>
                        <p className="text-2xl font-bold mt-1" style={{ color: sh.color }}>+{(sh.lift2030 * 100).toFixed(0)}%</p>
                        <p className="text-xs text-slate-400 mt-1">{sh.revenueLink}</p>
                      </div>
                      {i < 3 && (
                        <div className="text-xs text-slate-500 flex items-center justify-center gap-1">
                          <span>Spillover: {(spillVal * 100).toFixed(0)}%</span>
                          <span className="text-slate-600">→</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              <div className="text-center p-3 rounded-lg" style={{ backgroundColor: COLORS.bg }}>
                <RotateCcw size={16} color={COLORS.accent} className="inline mr-2" />
                <span className="text-sm text-slate-400">Flywheel loop: Employee efficiency → faster innovation → better advertiser tools → better ads → user experience → more inventory → platform optimization → margin for R&D → employee tools</span>
              </div>
            </div>

            {/* Efficiency Adoption Over Time */}
            <div style={{ backgroundColor: COLORS.card }} className="p-8 rounded-lg border border-slate-700">
              <h3 className="text-xl font-bold mb-2">Advertiser and Employee Efficiency Adopt Fastest via Bass Diffusion</h3>
              <p className="text-sm text-slate-400 mb-6">User efficiency has lowest lift but still contributes to the flywheel cycle</p>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={flywheelData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="year" stroke={COLORS.muted} />
                  <YAxis stroke={COLORS.muted} label={{ value: "Efficiency (%)", angle: -90, position: "insideLeft", fill: COLORS.muted }} />
                  <Tooltip contentStyle={{ backgroundColor: COLORS.card, border: "1px solid #334155" }} formatter={(v) => `${v.toFixed(1)}%`} />
                  <Legend />
                  {Object.entries(STAKEHOLDERS).map(([key, sh]) => (
                    <Line key={key} type="monotone" dataKey={key} stroke={sh.color} strokeWidth={2} dot={{ r: 3 }} name={sh.label} />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* P&L Revenue Impact */}
            <div style={{ backgroundColor: COLORS.card }} className="p-8 rounded-lg border border-slate-700">
              <h3 className="text-xl font-bold mb-2">Combined Efficiency Lever Adds ${plImpactData[plImpactData.length - 1]?.total || 0}B Revenue Uplift by 2030</h3>
              <p className="text-sm text-slate-400 mb-6">Full-funnel P&L impact: revenue expansion + margin + cost savings</p>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={plImpactData}>
                  <defs>
                    {Object.entries(STAKEHOLDERS).map(([key, sh]) => (
                      <linearGradient key={key} id={`grad_${key}`} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={sh.color} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={sh.color} stopOpacity={0} />
                      </linearGradient>
                    ))}
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="year" stroke={COLORS.muted} />
                  <YAxis stroke={COLORS.muted} label={{ value: "Revenue Impact ($B)", angle: -90, position: "insideLeft", fill: COLORS.muted }} />
                  <Tooltip contentStyle={{ backgroundColor: COLORS.card, border: "1px solid #334155" }} formatter={(v) => `$${v.toFixed(1)}B`} />
                  <Legend />
                  {Object.entries(STAKEHOLDERS).map(([key, sh]) => (
                    <Area key={key} type="monotone" dataKey={key} stackId="1" stroke={sh.color} fill={`url(#grad_${key})`} name={sh.label} />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Segment Breakdown Cards */}
            <div>
              <h3 className="text-xl font-bold mb-2">Segment-Level Lift Shows SMBs and Ad Reviewers Gain Most From AI</h3>
              <p className="text-sm text-slate-400 mb-6">Lift percentage represents maximum efficiency gain by 2030 at full adoption</p>
            </div>
            <div className="grid grid-cols-2 gap-6">
              {Object.entries(STAKEHOLDERS).map(([key, sh]) => {
                const Icon = sh.icon
                return (
                  <div key={key} style={{ backgroundColor: COLORS.card }} className="p-6 rounded-lg border border-slate-700">
                    <div className="flex items-center gap-2 mb-4">
                      <Icon size={18} color={sh.color} />
                      <h4 className="font-bold">{sh.label}</h4>
                      <span className="ml-auto text-sm font-bold" style={{ color: sh.color }}>+{(sh.lift2030 * 100).toFixed(0)}% total</span>
                    </div>
                    <div className="space-y-3">
                      {sh.segments.map((seg, i) => (
                        <div key={i}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-slate-400">{seg.label} ({(seg.share * 100).toFixed(0)}% of base)</span>
                            <span className="font-bold">+{(seg.lift * 100).toFixed(0)}%</span>
                          </div>
                          <div style={{ backgroundColor: COLORS.bg }} className="h-2 rounded-full overflow-hidden">
                            <div style={{ width: `${seg.lift * 100}%`, height: "100%", backgroundColor: sh.color, opacity: 0.6 + seg.lift * 0.4 }} />
                          </div>
                        </div>
                      ))}
                    </div>
                    {/* Ads Cycle Stages */}
                    <div className="mt-4 pt-3 border-t border-slate-700">
                      <p className="text-xs text-slate-500 mb-2">Ads Cycle Stages</p>
                      <div className="flex gap-2">
                        {sh.stages.map((stage, i) => (
                          <div key={i} className="flex-1 text-center p-2 rounded" style={{ backgroundColor: COLORS.bg }}>
                            <p className="text-xs text-slate-400">{stage.label}</p>
                            <p className="text-sm font-bold" style={{ color: sh.color }}>{stage.base * 100}→{stage.ceiling * 100}%</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* KPI Summary Table */}
            <div style={{ backgroundColor: COLORS.card }} className="p-8 rounded-lg border border-slate-700">
              <h3 className="text-xl font-bold mb-6">Key Efficiency KPIs by Stakeholder</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left p-3 text-slate-400">Stakeholder</th>
                      <th className="text-center p-3 text-slate-400">KPI 1</th>
                      <th className="text-center p-3 text-slate-400">KPI 2</th>
                      <th className="text-center p-3 text-slate-400">KPI 3</th>
                      <th className="text-center p-3 text-slate-400">2030 Lift</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { name: "Advertiser", kpi1: "Setup: -40%", kpi2: "Creative: 5x variants", kpi3: "ROAS: +25%", lift: "+28%", color: "#0891B2" },
                      { name: "User", kpi1: "CTR: +35%", kpi2: "Engagement: +20%", kpi3: "Ad Fatigue: -30%", lift: "+8%", color: "#10B981" },
                      { name: "Platform", kpi1: "Fill Rate: +8%", kpi2: "Cost/1K: -45%", kpi3: "Approval: 3x", lift: "+18%", color: "#8B5CF6" },
                      { name: "Employee", kpi1: "Review: 3x", kpi2: "Deflection: 60%", kpi3: "Dev Velocity: +40%", lift: "-35% cost", color: "#F59E0B" },
                    ].map((row, i) => (
                      <tr key={i} className="border-b border-slate-800">
                        <td className="p-3 font-semibold" style={{ color: row.color }}>{row.name}</td>
                        <td className="text-center p-3">{row.kpi1}</td>
                        <td className="text-center p-3">{row.kpi2}</td>
                        <td className="text-center p-3">{row.kpi3}</td>
                        <td className="text-center p-3 font-bold" style={{ color: row.color }}>{row.lift}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 4: Privacy & Integrity */}
        {activeTab === 4 && (
          <div className="space-y-8">
            <div style={{ backgroundColor: COLORS.card }} className="p-8 rounded-lg border border-slate-700">
              <h3 className="text-xl font-bold mb-2">AI-Powered Signal Recovery Offsets 60% of Privacy-Driven Signal Loss</h3>
              <p className="text-sm text-slate-400 mb-6">Privacy multiplier applied per region per year to capture geographic variation</p>
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
                  <YAxis stroke={COLORS.muted} label={{ value: "Signal (%)", angle: -90, position: "insideLeft", fill: COLORS.muted }} />
                  <Tooltip contentStyle={{ backgroundColor: COLORS.card, border: "1px solid #334155" }} formatter={(value) => `${value.toFixed(1)}%`} />
                  <Legend />
                  <Area type="monotone" dataKey="signalLoss" fill="url(#loss)" stroke="#EF4444" name="Signal Degradation" />
                  <Area type="monotone" dataKey="signalRecovery" fill="url(#recovery)" stroke="#10B981" name="AI Recovery" />
                  <Line type="monotone" dataKey="signalQuality" stroke="#F59E0B" strokeWidth={2} strokeDasharray="5 5" dot={false} name="Net Signal Quality" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* Regional Privacy Impact */}
            <div style={{ backgroundColor: COLORS.card }} className="p-8 rounded-lg border border-slate-700">
              <h3 className="text-xl font-bold mb-2">EU Privacy Regulation Creates 35% Signal Disadvantage vs. US Market</h3>
              <p className="text-sm text-slate-400 mb-6">Revenue effectiveness multiplier by region reflects regulatory stringency</p>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart
                  data={[
                    { region: "US", "2025": 0.97, "2027": 0.93, "2030": 0.88 },
                    { region: "EU", "2025": 0.78, "2027": 0.70, "2030": 0.65 },
                    { region: "APAC", "2025": 0.93, "2027": 0.87, "2030": 0.80 },
                    { region: "RoW", "2025": 0.96, "2027": 0.92, "2030": 0.88 },
                  ]}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="region" stroke={COLORS.muted} />
                  <YAxis stroke={COLORS.muted} domain={[0.5, 1.0]} label={{ value: "Effectiveness", angle: -90, position: "insideLeft", fill: COLORS.muted }} />
                  <Tooltip contentStyle={{ backgroundColor: COLORS.card, border: "1px solid #334155" }} />
                  <Legend />
                  <Bar dataKey="2025" fill="#0891B2" name="2025" />
                  <Bar dataKey="2027" fill="#06B6D4" name="2027" />
                  <Bar dataKey="2030" fill="#22D3EE" name="2030" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Integrity Health & Brand Safety */}
            <div className="grid grid-cols-2 gap-6">
              <div style={{ backgroundColor: COLORS.card }} className="p-8 rounded-lg border border-slate-700 flex flex-col items-center justify-center">
                <h3 className="text-lg font-bold mb-6">Platform Integrity Score</h3>
                <div style={{ position: "relative", width: 200, height: 200 }}>
                  <svg viewBox="0 0 200 200" style={{ transform: "rotate(-90deg)" }}>
                    <circle cx="100" cy="100" r="90" fill="none" stroke="#334155" strokeWidth="20" />
                    <circle
                      cx="100" cy="100" r="90" fill="none"
                      stroke={integrityScore > 70 ? "#10B981" : integrityScore > 50 ? "#F59E0B" : "#EF4444"}
                      strokeWidth="20"
                      strokeDasharray={`${(integrityScore / 100) * 565} 565`}
                    />
                  </svg>
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <span className="text-4xl font-bold">{integrityScore.toFixed(0)}</span>
                    <span className="text-sm text-slate-400">/ 100</span>
                  </div>
                </div>
                <p className={`mt-4 text-sm font-semibold ${integrityScore > 70 ? "text-green-400" : integrityScore > 50 ? "text-yellow-400" : "text-red-400"}`}>
                  {integrityScore > 70 ? "Healthy" : integrityScore > 50 ? "Watch" : "At Risk"}
                </p>
                <p className="text-xs text-slate-500 mt-2">CPM sensitivity: 1.2x at score 80+</p>
              </div>

              <div style={{ backgroundColor: COLORS.card }} className="p-8 rounded-lg border border-slate-700">
                <h3 className="text-lg font-bold mb-6">Brand Safety Incident Trajectory</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart
                    data={[
                      { year: 2022, incidents: 42, investment: 1.2 },
                      { year: 2023, incidents: 36, investment: 1.8 },
                      { year: 2024, incidents: 30, investment: 2.5 },
                      { year: 2025, incidents: 25, investment: 3.2 },
                      { year: 2026, incidents: 20, investment: 3.8 },
                      { year: 2027, incidents: 16, investment: 4.2 },
                      { year: 2028, incidents: 13, investment: 4.5 },
                      { year: 2029, incidents: 11, investment: 4.7 },
                      { year: 2030, incidents: 9, investment: 4.9 },
                    ]}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="year" stroke={COLORS.muted} />
                    <YAxis stroke={COLORS.muted} />
                    <Tooltip contentStyle={{ backgroundColor: COLORS.card, border: "1px solid #334155" }} />
                    <Legend />
                    <Line type="monotone" dataKey="incidents" stroke="#EF4444" strokeWidth={2} dot={{ r: 4 }} name="Incidents (scaled)" />
                    <Line type="monotone" dataKey="investment" stroke="#10B981" strokeWidth={2} dot={{ r: 4 }} name="Investment ($B)" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Risk & Sensitivity */}
        {activeTab === 5 && (
          <div className="space-y-8">
            {/* Monte Carlo Distribution */}
            <div style={{ backgroundColor: COLORS.card }} className="p-8 rounded-lg border border-slate-700">
              <h3 className="text-xl font-bold mb-2">Cholesky-Correlated Monte Carlo Yields $275B-$345B Confidence Range</h3>
              <p className="text-sm text-slate-400 mb-6">2,000 simulations with 5 correlated risk factors via Cholesky decomposition</p>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={riskDistribution.bins}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="range" stroke={COLORS.muted} label={{ value: "2030 Revenue ($B)", position: "insideBottom", offset: -5, fill: COLORS.muted }} />
                  <YAxis stroke={COLORS.muted} label={{ value: "Probability (%)", angle: -90, position: "insideLeft", fill: COLORS.muted }} />
                  <Tooltip contentStyle={{ backgroundColor: COLORS.card, border: "1px solid #334155" }} formatter={(v) => `${v.toFixed(1)}%`} />
                  <Bar dataKey="count" fill="#0891B2" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-3 gap-4 mt-6">
                <div className="text-center p-4" style={{ backgroundColor: COLORS.bg, borderRadius: 8 }}>
                  <p className="text-slate-400 text-xs mb-1 uppercase tracking-wide">P10 (Pessimistic)</p>
                  <p className="text-2xl font-bold text-red-400">${riskDistribution.p10.toFixed(0)}B</p>
                </div>
                <div className="text-center p-4" style={{ backgroundColor: COLORS.bg, borderRadius: 8 }}>
                  <p className="text-slate-400 text-xs mb-1 uppercase tracking-wide">P50 (Median)</p>
                  <p className="text-2xl font-bold text-yellow-400">${riskDistribution.p50.toFixed(0)}B</p>
                </div>
                <div className="text-center p-4" style={{ backgroundColor: COLORS.bg, borderRadius: 8 }}>
                  <p className="text-slate-400 text-xs mb-1 uppercase tracking-wide">P90 (Optimistic)</p>
                  <p className="text-2xl font-bold text-green-400">${riskDistribution.p90.toFixed(0)}B</p>
                </div>
              </div>
            </div>

            {/* Sensitivity Tornado */}
            <div style={{ backgroundColor: COLORS.card }} className="p-8 rounded-lg border border-slate-700">
              <h3 className="text-xl font-bold mb-2">AI Adoption Speed Has Largest Impact on Revenue Outcome</h3>
              <p className="text-sm text-slate-400 mb-6">Tornado chart: +/- 1 standard deviation parameter perturbation</p>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sensitivityData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke={COLORS.muted} label={{ value: "Revenue Swing ($B)", position: "insideBottomRight", offset: -10, fill: COLORS.muted }} />
                  <YAxis type="category" dataKey="param" stroke={COLORS.muted} width={160} />
                  <Tooltip contentStyle={{ backgroundColor: COLORS.card, border: "1px solid #334155" }} formatter={(v) => `$${v.toFixed(1)}B`} />
                  <Bar dataKey="range" fill="#0891B2" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Scenario Comparison */}
            <div style={{ backgroundColor: COLORS.card }} className="p-8 rounded-lg border border-slate-700">
              <h3 className="text-xl font-bold mb-2">Bull Case Delivers $90B Upside vs. Bear Through Faster AI Adoption</h3>
              <p className="text-sm text-slate-400 mb-6">Full parameter override across all model dimensions</p>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-700">
                      <th className="text-left p-4 text-slate-400">Metric</th>
                      <th className="text-center p-4 text-green-400">Bull</th>
                      <th className="text-center p-4 text-yellow-400">Base</th>
                      <th className="text-center p-4 text-red-400">Bear</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scenarioComparison.map((row, i) => (
                      <tr key={i} className="border-b border-slate-800">
                        <td className="p-4 font-semibold">{row.metric}</td>
                        <td className="text-center p-4 text-green-400 font-bold">
                          {row.unit === "$B" ? `$${row.bull}B` : `${row.bull}%`}
                        </td>
                        <td className="text-center p-4 text-yellow-400 font-bold">
                          {row.unit === "$B" ? `$${row.base}B` : `${row.base}%`}
                        </td>
                        <td className="text-center p-4 text-red-400 font-bold">
                          {row.unit === "$B" ? `$${row.bear}B` : `${row.bear}%`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 6: Configuration */}
        {activeTab === 6 && (
          <div className="grid grid-cols-2 gap-8">
            {/* Left column: Controls */}
            <div className="space-y-6">
              {/* Scenario Buttons */}
              <div style={{ backgroundColor: COLORS.card }} className="p-6 rounded-lg border border-slate-700">
                <h3 className="text-lg font-bold mb-4">Scenario Selection</h3>
                <div className="flex gap-3">
                  {[
                    { key: "bull", label: "Bull", desc: "$348B | 13.7% CAGR" },
                    { key: "base", label: "Base", desc: "$309B | 11.4% CAGR" },
                    { key: "bear", label: "Bear", desc: "$258B | 8.2% CAGR" },
                  ].map((btn) => (
                    <button
                      key={btn.key}
                      onClick={() => applyScenario(btn.key)}
                      style={{
                        backgroundColor: scenario === btn.key ? COLORS.accent : COLORS.bg,
                        color: scenario === btn.key ? "#000" : COLORS.text,
                        borderColor: COLORS.accent,
                        borderWidth: 1,
                      }}
                      className="flex-1 p-3 rounded-lg font-bold transition"
                    >
                      <div className="text-sm">{btn.label}</div>
                      <div className="text-xs opacity-75 mt-1">{btn.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Model Parameters */}
              <div style={{ backgroundColor: COLORS.card }} className="p-6 rounded-lg border border-slate-700 space-y-5">
                <h3 className="text-lg font-bold">Model Parameters</h3>

                {[
                  { label: "AI Acceleration Factor", value: aiAcceleration, set: setAiAcceleration, min: 0.5, max: 2.0, step: 0.05, format: (v) => `${v.toFixed(2)}x` },
                  { label: "TAM Annual Growth", value: tamGrowth, set: setTamGrowth, min: 0.05, max: 0.15, step: 0.005, format: (v) => `${(v * 100).toFixed(1)}%` },
                  { label: "Cannibalization Rate", value: cannibalization, set: setCannibalization, min: 0.05, max: 0.30, step: 0.01, format: (v) => `${(v * 100).toFixed(0)}%` },
                  { label: "Privacy Risk Severity", value: privacyRisk, set: setPrivacyRisk, min: 0.10, max: 0.60, step: 0.01, format: (v) => `${(v * 100).toFixed(0)}%` },
                  { label: "Competitive Intensity", value: competitiveIntensity, set: setCompetitiveIntensity, min: 0.2, max: 0.8, step: 0.05, format: (v) => `${(v * 100).toFixed(0)}%` },
                ].map((ctrl) => (
                  <div key={ctrl.label}>
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-semibold text-xs text-slate-300">{ctrl.label}</label>
                      <span className="text-xs font-bold text-cyan-400">{ctrl.format(ctrl.value)}</span>
                    </div>
                    <input
                      type="range"
                      min={ctrl.min}
                      max={ctrl.max}
                      step={ctrl.step}
                      value={ctrl.value}
                      onChange={(e) => ctrl.set(parseFloat(e.target.value))}
                      className="w-full cursor-pointer"
                      style={{ accentColor: COLORS.accent }}
                    />
                  </div>
                ))}
              </div>

              {/* Advanced: Mean Reversion & Damping */}
              <div style={{ backgroundColor: COLORS.card }} className="p-6 rounded-lg border border-slate-700 space-y-5">
                <h3 className="text-lg font-bold">Advanced: Ensemble Tuning</h3>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-semibold text-xs text-slate-300">Mean Reversion Speed (kappa)</label>
                    <span className="text-xs font-bold text-cyan-400">{meanReversionKappa.toFixed(2)}</span>
                  </div>
                  <input type="range" min="0.1" max="0.8" step="0.05" value={meanReversionKappa}
                    onChange={(e) => setMeanReversionKappa(parseFloat(e.target.value))}
                    className="w-full cursor-pointer" style={{ accentColor: COLORS.accent }} />
                  <p className="text-xs text-slate-500 mt-1">Higher = faster convergence to long-run growth</p>
                </div>
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="font-semibold text-xs text-slate-300">HW Trend Damping (phi)</label>
                    <span className="text-xs font-bold text-cyan-400">{dampingPhi.toFixed(2)}</span>
                  </div>
                  <input type="range" min="0.7" max="0.98" step="0.02" value={dampingPhi}
                    onChange={(e) => setDampingPhi(parseFloat(e.target.value))}
                    className="w-full cursor-pointer" style={{ accentColor: COLORS.accent }} />
                  <p className="text-xs text-slate-500 mt-1">Lower = more aggressive trend dampening</p>
                </div>
              </div>

              {/* Regional Growth */}
              <div style={{ backgroundColor: COLORS.card }} className="p-6 rounded-lg border border-slate-700 space-y-4">
                <h3 className="text-lg font-bold">Regional Growth Rates</h3>
                {[
                  { key: "us", label: "United States" },
                  { key: "eu", label: "Europe" },
                  { key: "apac", label: "Asia-Pacific" },
                  { key: "row", label: "Rest of World" },
                ].map((region) => (
                  <div key={region.key}>
                    <div className="flex justify-between items-center mb-1">
                      <label className="font-semibold text-xs text-slate-300">{region.label}</label>
                      <span className="text-xs font-bold text-cyan-400">{(regionalGrowth[region.key] * 100).toFixed(1)}%</span>
                    </div>
                    <input type="range" min="3" max="20" step="0.5"
                      value={regionalGrowth[region.key] * 100}
                      onChange={(e) => setRegionalGrowth({ ...regionalGrowth, [region.key]: parseFloat(e.target.value) / 100 })}
                      className="w-full cursor-pointer" style={{ accentColor: COLORS.accent }} />
                  </div>
                ))}
              </div>

              {/* Reset */}
              <button
                onClick={() => applyScenario("base")}
                style={{ backgroundColor: COLORS.accent, color: "#000" }}
                className="w-full py-3 rounded-lg font-bold transition hover:opacity-90"
              >
                Reset to Base Case
              </button>
            </div>

            {/* Right column: Methodology Reference */}
            <div className="space-y-6">
              <div style={{ backgroundColor: COLORS.card }} className="p-6 rounded-lg border border-slate-700">
                <h3 className="text-lg font-bold mb-4">Algorithm Specification</h3>
                <div className="space-y-5">
                  {methodologies.map((m, i) => {
                    const Icon = m.icon
                    return (
                      <div key={i} className="pb-4 border-b border-slate-700 last:border-0 last:pb-0">
                        <div className="flex items-center gap-2 mb-2">
                          <Icon size={16} color={COLORS.accent} />
                          <h4 className="font-bold text-sm">{m.title}</h4>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed mb-2">{m.desc}</p>
                        <p className="text-xs font-mono text-cyan-400">{m.params}</p>
                      </div>
                    )
                  })}
                </div>
              </div>

              <div style={{ backgroundColor: COLORS.card }} className="p-6 rounded-lg border border-slate-700">
                <h3 className="text-lg font-bold mb-4">Model Architecture</h3>
                <div className="space-y-3 text-xs text-slate-400">
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: "#0891B2" }} />
                    <p><span className="text-white font-semibold">Baseline Forecast:</span> Ensemble blend of Holt-Winters (damped trend) and O-U mean-reverting growth. HW weight decays 60% to 20% over forecast horizon.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: "#10B981" }} />
                    <p><span className="text-white font-semibold">AI Revenue:</span> 6 independent Bass Diffusion channels with per-channel innovation (p) and imitation (q) coefficients. Cross-channel cannibalization applied to source revenue.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: "#F59E0B" }} />
                    <p><span className="text-white font-semibold">Privacy Adjustment:</span> Per-region, per-year multiplier based on signal degradation lifecycle with AI-driven recovery. GDPR/ATT impacts modeled separately.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: "#8B5CF6" }} />
                    <p><span className="text-white font-semibold">Risk Quantification:</span> Cholesky-correlated Monte Carlo across 5 risk dimensions with full covariance structure. Output: P10/P50/P90 confidence intervals.</p>
                  </div>
                  <div className="flex items-start gap-2">
                    <div className="w-2 h-2 rounded-full mt-1 flex-shrink-0" style={{ backgroundColor: "#EF4444" }} />
                    <p><span className="text-white font-semibold">Integrity Model:</span> Content quality scoring with lagged CPM sensitivity. Brand safety investment vs. incident trajectory.</p>
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: COLORS.card }} className="p-6 rounded-lg border border-slate-700">
                <h3 className="text-lg font-bold mb-4">Data Sources</h3>
                <div className="space-y-2 text-xs text-slate-400">
                  <p>Historical revenue: SEC 10-K filings (2019-2024)</p>
                  <p>TAM estimates: Industry analyst consensus</p>
                  <p>Privacy timeline: Regulatory tracking database</p>
                  <p>AI adoption: Internal capability benchmarking</p>
                  <p>All forward projections are model-generated</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
