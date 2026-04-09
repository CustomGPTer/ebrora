// src/data/historical-weather.ts
// Historical Weather Data Tool — Open-Meteo Archive API
// Free API, no key required, hourly data from 1940-present

// ─── Types ───────────────────────────────────────────────────
export type ViewMode = "day" | "week" | "month";
export type WindUnit = "mph" | "kmh";

export interface UKTown {
  name: string;
  region: string;
  lat: number;
  lon: number;
}

export interface DayWeather {
  date: string;         // YYYY-MM-DD
  tempC: number | null;
  tempMinC: number | null;   // overnight low (3AM)
  windKmh: number | null;
  windDir: number | null;
  humidity: number | null;
  precipMm: number | null;
  cloudCover: number | null;
  weatherCode: number | null;
  // Comparison baseline
  avgTempC: number | null;
  avgPrecipMm: number | null;
  avgWindKmh: number | null;
}

export interface WeatherResult {
  location: UKTown;
  view: ViewMode;
  startDate: string;
  endDate: string;
  days: DayWeather[];
  avgPeriod: [number, number];   // e.g. [2000, 2025]
  summary: {
    avgTemp: number;
    maxTemp: number;
    minTemp: number;
    totalRainMm: number;
    rainDays: number;
    avgWind: number;
    maxWind: number;
    avgHumidity: number;
    avgCloud: number;
    dominantCode: number;
    // Comparison
    baselineAvgTemp: number;
    baselineAvgRain: number;
    tempDelta: number;
    rainDelta: number;
  };
}

// ─── WMO Weather Codes ──────────────────────────────────────
export type IconType = "clear" | "partly-cloudy" | "cloudy" | "overcast" | "fog" | "drizzle" | "rain-light" | "rain" | "rain-heavy" | "freezing-rain" | "snow-light" | "snow" | "snow-heavy" | "sleet" | "thunder" | "thunder-rain";

export interface WMOEntry {
  description: string;
  icon: IconType;
  severity: number; // 0=clear, 1=mild, 2=moderate, 3=severe
}

export const WMO_CODES: Record<number, WMOEntry> = {
  0:  { description: "Clear sky", icon: "clear", severity: 0 },
  1:  { description: "Mainly clear", icon: "clear", severity: 0 },
  2:  { description: "Partly cloudy", icon: "partly-cloudy", severity: 0 },
  3:  { description: "Overcast", icon: "overcast", severity: 1 },
  45: { description: "Fog", icon: "fog", severity: 1 },
  48: { description: "Depositing rime fog", icon: "fog", severity: 1 },
  51: { description: "Light drizzle", icon: "drizzle", severity: 1 },
  53: { description: "Moderate drizzle", icon: "drizzle", severity: 1 },
  55: { description: "Dense drizzle", icon: "rain-light", severity: 2 },
  56: { description: "Light freezing drizzle", icon: "freezing-rain", severity: 2 },
  57: { description: "Dense freezing drizzle", icon: "freezing-rain", severity: 2 },
  61: { description: "Slight rain", icon: "rain-light", severity: 1 },
  63: { description: "Moderate rain", icon: "rain", severity: 2 },
  65: { description: "Heavy rain", icon: "rain-heavy", severity: 3 },
  66: { description: "Light freezing rain", icon: "freezing-rain", severity: 2 },
  67: { description: "Heavy freezing rain", icon: "freezing-rain", severity: 3 },
  71: { description: "Slight snowfall", icon: "snow-light", severity: 2 },
  73: { description: "Moderate snowfall", icon: "snow", severity: 2 },
  75: { description: "Heavy snowfall", icon: "snow-heavy", severity: 3 },
  77: { description: "Snow grains", icon: "snow-light", severity: 1 },
  80: { description: "Slight rain showers", icon: "rain-light", severity: 1 },
  81: { description: "Moderate rain showers", icon: "rain", severity: 2 },
  82: { description: "Violent rain showers", icon: "rain-heavy", severity: 3 },
  85: { description: "Slight snow showers", icon: "snow-light", severity: 2 },
  86: { description: "Heavy snow showers", icon: "snow-heavy", severity: 3 },
  95: { description: "Thunderstorm", icon: "thunder", severity: 3 },
  96: { description: "Thunderstorm with slight hail", icon: "thunder-rain", severity: 3 },
  99: { description: "Thunderstorm with heavy hail", icon: "thunder-rain", severity: 3 },
};

export function getWMO(code: number | null): WMOEntry {
  if (code === null) return { description: "No data", icon: "cloudy", severity: 0 };
  return WMO_CODES[code] || { description: `Code ${code}`, icon: "cloudy", severity: 0 };
}

// ─── UK Towns Database ──────────────────────────────────────
export const UK_TOWNS: UKTown[] = [
  // England — Major Cities
  { name: "London", region: "Greater London", lat: 51.5074, lon: -0.1278 },
  { name: "Birmingham", region: "West Midlands", lat: 52.4862, lon: -1.8904 },
  { name: "Manchester", region: "Greater Manchester", lat: 53.4808, lon: -2.2426 },
  { name: "Leeds", region: "West Yorkshire", lat: 53.8008, lon: -1.5491 },
  { name: "Liverpool", region: "Merseyside", lat: 53.4084, lon: -2.9916 },
  { name: "Sheffield", region: "South Yorkshire", lat: 53.3811, lon: -1.4701 },
  { name: "Bristol", region: "Bristol", lat: 51.4545, lon: -2.5879 },
  { name: "Newcastle upon Tyne", region: "Tyne and Wear", lat: 54.9783, lon: -1.6178 },
  { name: "Nottingham", region: "Nottinghamshire", lat: 52.9548, lon: -1.1581 },
  { name: "Leicester", region: "Leicestershire", lat: 52.6369, lon: -1.1398 },
  { name: "Coventry", region: "West Midlands", lat: 52.4068, lon: -1.5197 },
  { name: "Bradford", region: "West Yorkshire", lat: 53.7960, lon: -1.7594 },
  { name: "Stoke-on-Trent", region: "Staffordshire", lat: 53.0027, lon: -2.1794 },
  { name: "Wolverhampton", region: "West Midlands", lat: 52.5870, lon: -2.1288 },
  { name: "Plymouth", region: "Devon", lat: 50.3755, lon: -4.1427 },
  { name: "Southampton", region: "Hampshire", lat: 50.9097, lon: -1.4044 },
  { name: "Derby", region: "Derbyshire", lat: 52.9225, lon: -1.4746 },
  { name: "Portsmouth", region: "Hampshire", lat: 50.8198, lon: -1.0880 },
  { name: "York", region: "North Yorkshire", lat: 53.9591, lon: -1.0815 },
  { name: "Sunderland", region: "Tyne and Wear", lat: 54.9069, lon: -1.3838 },
  // England — Major Towns
  { name: "Salford", region: "Greater Manchester", lat: 53.4875, lon: -2.2901 },
  { name: "Bolton", region: "Greater Manchester", lat: 53.5785, lon: -2.4299 },
  { name: "Oldham", region: "Greater Manchester", lat: 53.5409, lon: -2.1114 },
  { name: "Stockport", region: "Greater Manchester", lat: 53.4106, lon: -2.1575 },
  { name: "Wigan", region: "Greater Manchester", lat: 53.5448, lon: -2.6318 },
  { name: "Rochdale", region: "Greater Manchester", lat: 53.6097, lon: -2.1561 },
  { name: "Warrington", region: "Cheshire", lat: 53.3900, lon: -2.5970 },
  { name: "Chester", region: "Cheshire", lat: 53.1905, lon: -2.8909 },
  { name: "Crewe", region: "Cheshire", lat: 53.0988, lon: -2.4405 },
  { name: "Macclesfield", region: "Cheshire", lat: 53.2586, lon: -2.1257 },
  { name: "Northwich", region: "Cheshire", lat: 53.2587, lon: -2.5182 },
  { name: "Blackburn", region: "Lancashire", lat: 53.7488, lon: -2.4822 },
  { name: "Blackpool", region: "Lancashire", lat: 53.8142, lon: -3.0503 },
  { name: "Burnley", region: "Lancashire", lat: 53.7893, lon: -2.2483 },
  { name: "Lancaster", region: "Lancashire", lat: 54.0466, lon: -2.8007 },
  { name: "Preston", region: "Lancashire", lat: 53.7632, lon: -2.7031 },
  { name: "Carlisle", region: "Cumbria", lat: 54.8951, lon: -2.9382 },
  { name: "Penrith", region: "Cumbria", lat: 54.6641, lon: -2.7527 },
  { name: "Kendal", region: "Cumbria", lat: 54.3268, lon: -2.7461 },
  { name: "Barrow-in-Furness", region: "Cumbria", lat: 54.1108, lon: -3.2266 },
  { name: "Middlesbrough", region: "North Yorkshire", lat: 54.5742, lon: -1.2350 },
  { name: "Darlington", region: "County Durham", lat: 54.5232, lon: -1.5527 },
  { name: "Durham", region: "County Durham", lat: 54.7761, lon: -1.5733 },
  { name: "Hartlepool", region: "County Durham", lat: 54.6863, lon: -1.2129 },
  { name: "Scarborough", region: "North Yorkshire", lat: 54.2808, lon: -0.4048 },
  { name: "Harrogate", region: "North Yorkshire", lat: 53.9921, lon: -1.5418 },
  { name: "Huddersfield", region: "West Yorkshire", lat: 53.6458, lon: -1.7850 },
  { name: "Wakefield", region: "West Yorkshire", lat: 53.6830, lon: -1.4977 },
  { name: "Halifax", region: "West Yorkshire", lat: 53.7225, lon: -1.8627 },
  { name: "Doncaster", region: "South Yorkshire", lat: 53.5228, lon: -1.1285 },
  { name: "Rotherham", region: "South Yorkshire", lat: 53.4326, lon: -1.3568 },
  { name: "Barnsley", region: "South Yorkshire", lat: 53.5529, lon: -1.4793 },
  { name: "Scunthorpe", region: "Lincolnshire", lat: 53.5810, lon: -0.6506 },
  { name: "Grimsby", region: "Lincolnshire", lat: 53.5673, lon: -0.0803 },
  { name: "Lincoln", region: "Lincolnshire", lat: 53.2307, lon: -0.5406 },
  { name: "Hull", region: "East Riding of Yorkshire", lat: 53.7676, lon: -0.3274 },
  { name: "Peterborough", region: "Cambridgeshire", lat: 52.5695, lon: -0.2405 },
  { name: "Cambridge", region: "Cambridgeshire", lat: 52.2053, lon: 0.1218 },
  { name: "Norwich", region: "Norfolk", lat: 52.6309, lon: 1.2974 },
  { name: "Ipswich", region: "Suffolk", lat: 52.0567, lon: 1.1482 },
  { name: "Colchester", region: "Essex", lat: 51.8959, lon: 0.8919 },
  { name: "Chelmsford", region: "Essex", lat: 51.7356, lon: 0.4685 },
  { name: "Southend-on-Sea", region: "Essex", lat: 51.5406, lon: 0.7077 },
  { name: "Milton Keynes", region: "Buckinghamshire", lat: 52.0406, lon: -0.7594 },
  { name: "Oxford", region: "Oxfordshire", lat: 51.7520, lon: -1.2577 },
  { name: "Reading", region: "Berkshire", lat: 51.4543, lon: -0.9781 },
  { name: "Swindon", region: "Wiltshire", lat: 51.5558, lon: -1.7797 },
  { name: "Salisbury", region: "Wiltshire", lat: 51.0688, lon: -1.7945 },
  { name: "Bath", region: "Somerset", lat: 51.3811, lon: -2.3590 },
  { name: "Gloucester", region: "Gloucestershire", lat: 51.8642, lon: -2.2382 },
  { name: "Cheltenham", region: "Gloucestershire", lat: 51.8994, lon: -2.0783 },
  { name: "Worcester", region: "Worcestershire", lat: 52.1920, lon: -2.2214 },
  { name: "Hereford", region: "Herefordshire", lat: 52.0565, lon: -2.7160 },
  { name: "Shrewsbury", region: "Shropshire", lat: 52.7077, lon: -2.7534 },
  { name: "Telford", region: "Shropshire", lat: 52.6779, lon: -2.4491 },
  { name: "Stafford", region: "Staffordshire", lat: 52.8065, lon: -2.1169 },
  { name: "Burton upon Trent", region: "Staffordshire", lat: 52.8022, lon: -1.6428 },
  { name: "Mansfield", region: "Nottinghamshire", lat: 53.1397, lon: -1.1974 },
  { name: "Chesterfield", region: "Derbyshire", lat: 53.2350, lon: -1.4211 },
  { name: "Northampton", region: "Northamptonshire", lat: 52.2405, lon: -0.9027 },
  { name: "Bedford", region: "Bedfordshire", lat: 52.1356, lon: -0.4685 },
  { name: "Luton", region: "Bedfordshire", lat: 51.8787, lon: -0.4200 },
  { name: "St Albans", region: "Hertfordshire", lat: 51.7553, lon: -0.3363 },
  { name: "Watford", region: "Hertfordshire", lat: 51.6565, lon: -0.3963 },
  { name: "Guildford", region: "Surrey", lat: 51.2362, lon: -0.5704 },
  { name: "Brighton", region: "East Sussex", lat: 50.8225, lon: -0.1372 },
  { name: "Hastings", region: "East Sussex", lat: 50.8536, lon: 0.5730 },
  { name: "Canterbury", region: "Kent", lat: 51.2802, lon: 1.0789 },
  { name: "Maidstone", region: "Kent", lat: 51.2724, lon: 0.5222 },
  { name: "Dover", region: "Kent", lat: 51.1295, lon: 1.3089 },
  { name: "Exeter", region: "Devon", lat: 50.7184, lon: -3.5339 },
  { name: "Torquay", region: "Devon", lat: 50.4619, lon: -3.5253 },
  { name: "Taunton", region: "Somerset", lat: 51.0190, lon: -3.1000 },
  { name: "Bournemouth", region: "Dorset", lat: 50.7192, lon: -1.8808 },
  { name: "Poole", region: "Dorset", lat: 50.7151, lon: -1.9871 },
  { name: "Dorchester", region: "Dorset", lat: 50.7151, lon: -2.4375 },
  { name: "Truro", region: "Cornwall", lat: 50.2632, lon: -5.0510 },
  { name: "Penzance", region: "Cornwall", lat: 50.1188, lon: -5.5325 },
  { name: "Newquay", region: "Cornwall", lat: 50.4129, lon: -5.0757 },
  // Scotland
  { name: "Edinburgh", region: "Scotland", lat: 55.9533, lon: -3.1883 },
  { name: "Glasgow", region: "Scotland", lat: 55.8642, lon: -4.2518 },
  { name: "Aberdeen", region: "Scotland", lat: 57.1497, lon: -2.0943 },
  { name: "Dundee", region: "Scotland", lat: 56.4620, lon: -2.9707 },
  { name: "Inverness", region: "Scotland", lat: 57.4778, lon: -4.2247 },
  { name: "Perth", region: "Scotland", lat: 56.3960, lon: -3.4374 },
  { name: "Stirling", region: "Scotland", lat: 56.1166, lon: -3.9369 },
  { name: "Dumfries", region: "Scotland", lat: 55.0700, lon: -3.6052 },
  { name: "Ayr", region: "Scotland", lat: 55.4583, lon: -4.6292 },
  { name: "Fort William", region: "Scotland", lat: 56.8198, lon: -5.1052 },
  { name: "Oban", region: "Scotland", lat: 56.4153, lon: -5.4716 },
  { name: "Wick", region: "Scotland", lat: 58.4399, lon: -3.0926 },
  { name: "Lerwick", region: "Shetland", lat: 60.1535, lon: -1.1449 },
  { name: "Kirkwall", region: "Orkney", lat: 58.9811, lon: -2.9596 },
  { name: "Stornoway", region: "Western Isles", lat: 58.2093, lon: -6.3856 },
  { name: "Paisley", region: "Scotland", lat: 55.8456, lon: -4.4234 },
  { name: "East Kilbride", region: "Scotland", lat: 55.7647, lon: -4.1769 },
  { name: "Falkirk", region: "Scotland", lat: 56.0019, lon: -3.7839 },
  { name: "Kilmarnock", region: "Scotland", lat: 55.6116, lon: -4.4955 },
  // Wales
  { name: "Cardiff", region: "Wales", lat: 51.4816, lon: -3.1791 },
  { name: "Swansea", region: "Wales", lat: 51.6214, lon: -3.9436 },
  { name: "Newport", region: "Wales", lat: 51.5842, lon: -2.9977 },
  { name: "Wrexham", region: "Wales", lat: 53.0468, lon: -2.9925 },
  { name: "Bangor", region: "Wales", lat: 53.2274, lon: -4.1293 },
  { name: "Aberystwyth", region: "Wales", lat: 52.4153, lon: -4.0829 },
  { name: "Carmarthen", region: "Wales", lat: 51.8576, lon: -4.3164 },
  { name: "Llanelli", region: "Wales", lat: 51.6840, lon: -4.1629 },
  { name: "Merthyr Tydfil", region: "Wales", lat: 51.7485, lon: -3.3782 },
  { name: "Rhyl", region: "Wales", lat: 53.3195, lon: -3.4900 },
  { name: "Caernarfon", region: "Wales", lat: 53.1393, lon: -4.2720 },
  { name: "Brecon", region: "Wales", lat: 51.9451, lon: -3.3956 },
  // Northern Ireland
  { name: "Belfast", region: "Northern Ireland", lat: 54.5973, lon: -5.9301 },
  { name: "Derry/Londonderry", region: "Northern Ireland", lat: 54.9966, lon: -7.3086 },
  { name: "Lisburn", region: "Northern Ireland", lat: 54.5162, lon: -6.0580 },
  { name: "Newry", region: "Northern Ireland", lat: 54.1751, lon: -6.3402 },
  { name: "Bangor", region: "Northern Ireland", lat: 54.6593, lon: -5.6699 },
  { name: "Armagh", region: "Northern Ireland", lat: 54.3503, lon: -6.6528 },
  { name: "Omagh", region: "Northern Ireland", lat: 54.5977, lon: -7.2972 },
  { name: "Enniskillen", region: "Northern Ireland", lat: 54.3460, lon: -7.6376 },
  { name: "Coleraine", region: "Northern Ireland", lat: 55.1327, lon: -6.6625 },
  // Additional English towns for coverage
  { name: "Walsall", region: "West Midlands", lat: 52.5861, lon: -1.9829 },
  { name: "Dudley", region: "West Midlands", lat: 52.5085, lon: -2.0818 },
  { name: "Solihull", region: "West Midlands", lat: 52.4115, lon: -1.7739 },
  { name: "Tamworth", region: "Staffordshire", lat: 52.6332, lon: -1.6909 },
  { name: "Nuneaton", region: "Warwickshire", lat: 52.5230, lon: -1.4680 },
  { name: "Rugby", region: "Warwickshire", lat: 52.3709, lon: -1.2616 },
  { name: "Leamington Spa", region: "Warwickshire", lat: 52.2922, lon: -1.5369 },
  { name: "Stratford-upon-Avon", region: "Warwickshire", lat: 52.1917, lon: -1.7083 },
  { name: "Kettering", region: "Northamptonshire", lat: 52.3972, lon: -0.7279 },
  { name: "Corby", region: "Northamptonshire", lat: 52.4914, lon: -0.6913 },
  { name: "Wellingborough", region: "Northamptonshire", lat: 52.3025, lon: -0.6940 },
  { name: "Loughborough", region: "Leicestershire", lat: 52.7721, lon: -1.2064 },
  { name: "Grantham", region: "Lincolnshire", lat: 52.9118, lon: -0.6387 },
  { name: "Boston", region: "Lincolnshire", lat: 52.9778, lon: -0.0267 },
  { name: "Skegness", region: "Lincolnshire", lat: 53.1441, lon: 0.3400 },
  { name: "Newark-on-Trent", region: "Nottinghamshire", lat: 53.0769, lon: -0.8082 },
  { name: "Worksop", region: "Nottinghamshire", lat: 53.3042, lon: -1.1245 },
  { name: "Matlock", region: "Derbyshire", lat: 53.1380, lon: -1.5551 },
  { name: "Buxton", region: "Derbyshire", lat: 53.2592, lon: -1.9119 },
  { name: "Whitby", region: "North Yorkshire", lat: 54.4860, lon: -0.6152 },
  { name: "Ripon", region: "North Yorkshire", lat: 54.1386, lon: -1.5199 },
  { name: "Skipton", region: "North Yorkshire", lat: 53.9610, lon: -2.0175 },
  { name: "Hexham", region: "Northumberland", lat: 54.9714, lon: -2.1007 },
  { name: "Alnwick", region: "Northumberland", lat: 55.4136, lon: -1.7058 },
  { name: "Berwick-upon-Tweed", region: "Northumberland", lat: 55.7649, lon: -2.0069 },
  { name: "Workington", region: "Cumbria", lat: 54.6455, lon: -3.5433 },
  { name: "Whitehaven", region: "Cumbria", lat: 54.5491, lon: -3.5867 },
  { name: "Keswick", region: "Cumbria", lat: 54.6013, lon: -3.1347 },
  { name: "Windermere", region: "Cumbria", lat: 54.3811, lon: -2.9067 },
  { name: "King's Lynn", region: "Norfolk", lat: 52.7516, lon: 0.3969 },
  { name: "Great Yarmouth", region: "Norfolk", lat: 52.6060, lon: 1.7295 },
  { name: "Lowestoft", region: "Suffolk", lat: 52.4771, lon: 1.7505 },
  { name: "Bury St Edmunds", region: "Suffolk", lat: 52.2474, lon: 0.7183 },
  { name: "Felixstowe", region: "Suffolk", lat: 51.9637, lon: 1.3517 },
  { name: "Harlow", region: "Essex", lat: 51.7727, lon: 0.1028 },
  { name: "Basildon", region: "Essex", lat: 51.5762, lon: 0.4887 },
  { name: "Stevenage", region: "Hertfordshire", lat: 51.9024, lon: -0.2017 },
  { name: "Hemel Hempstead", region: "Hertfordshire", lat: 51.7530, lon: -0.4688 },
  { name: "Aylesbury", region: "Buckinghamshire", lat: 51.8168, lon: -0.8084 },
  { name: "High Wycombe", region: "Buckinghamshire", lat: 51.6295, lon: -0.7488 },
  { name: "Slough", region: "Berkshire", lat: 51.5105, lon: -0.5950 },
  { name: "Newbury", region: "Berkshire", lat: 51.4010, lon: -1.3230 },
  { name: "Basingstoke", region: "Hampshire", lat: 51.2667, lon: -1.0876 },
  { name: "Winchester", region: "Hampshire", lat: 51.0632, lon: -1.3080 },
  { name: "Andover", region: "Hampshire", lat: 51.2111, lon: -1.4901 },
  { name: "Farnborough", region: "Hampshire", lat: 51.2892, lon: -0.7536 },
  { name: "Crawley", region: "West Sussex", lat: 51.1092, lon: -0.1872 },
  { name: "Chichester", region: "West Sussex", lat: 50.8365, lon: -0.7792 },
  { name: "Worthing", region: "West Sussex", lat: 50.8148, lon: -0.3714 },
  { name: "Eastbourne", region: "East Sussex", lat: 50.7685, lon: 0.2908 },
  { name: "Tunbridge Wells", region: "Kent", lat: 51.1322, lon: 0.2631 },
  { name: "Ashford", region: "Kent", lat: 51.1462, lon: 0.8742 },
  { name: "Margate", region: "Kent", lat: 51.3813, lon: 1.3862 },
  { name: "Folkestone", region: "Kent", lat: 51.0816, lon: 1.1660 },
  { name: "Chatham", region: "Kent", lat: 51.3700, lon: 0.5217 },
  { name: "Barnstaple", region: "Devon", lat: 51.0802, lon: -4.0599 },
  { name: "Bideford", region: "Devon", lat: 51.0178, lon: -4.2069 },
  { name: "Yeovil", region: "Somerset", lat: 50.9422, lon: -2.6371 },
  { name: "Bridgwater", region: "Somerset", lat: 51.1280, lon: -2.9920 },
  { name: "Weston-super-Mare", region: "Somerset", lat: 51.3470, lon: -2.9770 },
  { name: "Weymouth", region: "Dorset", lat: 50.6144, lon: -2.4573 },
  { name: "Falmouth", region: "Cornwall", lat: 50.1526, lon: -5.0655 },
  { name: "Bodmin", region: "Cornwall", lat: 50.4710, lon: -4.7183 },
  { name: "St Austell", region: "Cornwall", lat: 50.3400, lon: -4.7884 },
];

// ─── API Functions ───────────────────────────────────────────

interface OpenMeteoResponse {
  hourly?: {
    time?: string[];
    temperature_2m?: (number | null)[];
    relative_humidity_2m?: (number | null)[];
    precipitation?: (number | null)[];
    weather_code?: (number | null)[];
    wind_speed_10m?: (number | null)[];
    cloud_cover?: (number | null)[];
  };
}

const ARCHIVE_API = "https://archive-api.open-meteo.com/v1/archive";
const FORECAST_API = "https://api.open-meteo.com/v1/forecast";
const HOURLY_PARAMS = "temperature_2m,relative_humidity_2m,precipitation,weather_code,wind_speed_10m,cloud_cover";

/** Fetch hourly weather — uses forecast API for recent dates, archive for older */
export async function fetchWeather(
  lat: number, lon: number, startDate: string, endDate: string
): Promise<OpenMeteoResponse> {
  const now = new Date();
  const end = new Date(endDate + "T12:00:00");
  const daysAgo = Math.floor((now.getTime() - end.getTime()) / 86400000);

  // Use forecast API for dates within last 90 days (more reliable, includes today)
  // Use archive API for older dates
  const useArchive = daysAgo > 90;
  const baseUrl = useArchive ? ARCHIVE_API : FORECAST_API;

  const params = new URLSearchParams({
    latitude: lat.toFixed(4),
    longitude: lon.toFixed(4),
    start_date: startDate,
    end_date: endDate,
    hourly: HOURLY_PARAMS,
    timezone: "Europe/London",
  });

  let res: Response;
  try {
    res = await fetch(`${baseUrl}?${params}`);
  } catch {
    throw new Error("Network error -- could not reach weather API. Check your connection.");
  }

  if (!res.ok) {
    let detail = "";
    try { const body = await res.json(); detail = body?.reason || body?.error || ""; } catch { /* ignore */ }
    // If archive fails for this range, retry with forecast API
    if (useArchive) {
      try {
        const fallbackRes = await fetch(`${FORECAST_API}?${params}`);
        if (fallbackRes.ok) return fallbackRes.json();
      } catch { /* ignore */ }
    }
    throw new Error(`Weather API error ${res.status}${detail ? ": " + detail : ""}. Try a different date range.`);
  }

  return res.json();
}

export interface DayDataEntry {
  noon: number;
  values: Record<string, number | null>;
  min3am: number | null;
}

/** Extract 12PM and 3AM values from hourly API response */
export function extractDayData(data: OpenMeteoResponse): Map<string, DayDataEntry> {
  const map = new Map<string, DayDataEntry>();
  const h = data.hourly;
  if (!h || !h.time) return map;

  for (let i = 0; i < h.time.length; i++) {
    const dt = h.time[i]; // "YYYY-MM-DDTHH:00"
    const date = dt.slice(0, 10);
    const hour = parseInt(dt.slice(11, 13), 10);

    if (hour === 12) {
      const entry = map.get(date) || { noon: i, values: {}, min3am: null };
      entry.noon = i;
      entry.values = {
        tempC: h.temperature_2m?.[i] ?? null,
        humidity: h.relative_humidity_2m?.[i] ?? null,
        precipMm: h.precipitation?.[i] ?? null,
        weatherCode: h.weather_code?.[i] ?? null,
        windKmh: h.wind_speed_10m?.[i] ?? null,
        cloudCover: h.cloud_cover?.[i] ?? null,
      };
      map.set(date, entry);
    }
    if (hour === 3) {
      const entry = map.get(date) || { noon: -1, values: {}, min3am: null };
      entry.min3am = h.temperature_2m?.[i] ?? null;
      map.set(date, entry);
    }
  }
  return map;
}

/** Fetch and compute the climate baseline average for a set of dates across years */
export async function fetchBaseline(
  lat: number, lon: number, targetDates: string[], avgStart: number, avgEnd: number
): Promise<Map<string, { avgTempC: number; avgPrecipMm: number; avgWindKmh: number }>> {
  const result = new Map<string, { avgTempC: number; avgPrecipMm: number; avgWindKmh: number }>();
  const mmddSet = new Set(targetDates.map(d => d.slice(5)));

  // Determine the month range we need
  const months = [...mmddSet].map(d => parseInt(d.slice(0, 2)));
  const startMM = Math.min(...months);
  const endMM = Math.max(...months);
  const sd = String(startMM).padStart(2, "0");
  const ed = String(endMM).padStart(2, "0");

  // Accumulate per MM-DD
  const accum: Record<string, { temps: number[]; precips: number[]; winds: number[] }> = {};
  for (const mmdd of mmddSet) accum[mmdd] = { temps: [], precips: [], winds: [] };

  const currentYear = new Date().getFullYear();
  const today = new Date().toISOString().slice(0, 10);
  const endY = Math.min(avgEnd, currentYear);

  // Batch into 5-year chunks and fetch in parallel
  const CHUNK = 5;
  const chunks: [string, string][] = [];
  for (let yr = avgStart; yr <= endY; yr += CHUNK) {
    const chunkEnd = Math.min(yr + CHUNK - 1, endY);
    const lastDay = new Date(chunkEnd, endMM, 0).getDate();
    let endDate = `${chunkEnd}-${ed}-${lastDay}`;
    if (endDate > today) endDate = today; // clamp to today — archive API has no future data
    chunks.push([`${yr}-${sd}-01`, endDate]);
  }

  // Fetch all chunks in parallel
  const responses = await Promise.allSettled(
    chunks.map(([s, e]) => fetchWeather(lat, lon, s, e))
  );

  for (const res of responses) {
    if (res.status !== "fulfilled") continue;
    const dayMap = extractDayData(res.value);
    for (const [dateStr, entry] of dayMap) {
      const mmdd = dateStr.slice(5);
      if (accum[mmdd]) {
        const v = entry.values;
        if (v.tempC !== null && v.tempC !== undefined) accum[mmdd].temps.push(v.tempC as number);
        if (v.precipMm !== null && v.precipMm !== undefined) accum[mmdd].precips.push(v.precipMm as number);
        if (v.windKmh !== null && v.windKmh !== undefined) accum[mmdd].winds.push(v.windKmh as number);
      }
    }
  }

  // Compute averages
  const avg = (arr: number[]) => arr.length > 0 ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;
  for (const [mmdd, a] of Object.entries(accum)) {
    for (const td of targetDates) {
      if (td.slice(5) === mmdd) {
        result.set(td, { avgTempC: avg(a.temps), avgPrecipMm: avg(a.precips), avgWindKmh: avg(a.winds) });
      }
    }
  }

  return result;
}

// ─── Utility ─────────────────────────────────────────────────

export function kmhToMph(kmh: number): number { return kmh * 0.621371; }
export function fmtWind(kmh: number | null, unit: WindUnit): string {
  if (kmh === null) return "--";
  return unit === "mph" ? `${kmhToMph(kmh).toFixed(1)} mph` : `${kmh.toFixed(1)} km/h`;
}
export function fmtWindVal(kmh: number | null, unit: WindUnit): number {
  if (kmh === null) return 0;
  return unit === "mph" ? kmhToMph(kmh) : kmh;
}

export function getDateRange(date: string, view: ViewMode): [string, string] {
  const d = new Date(date + "T12:00:00");
  const today = new Date().toISOString().slice(0, 10);
  const clamp = (s: string) => s > today ? today : s;
  if (view === "day") return [date > today ? today : date, date > today ? today : date];
  if (view === "week") {
    const start = new Date(d); start.setDate(d.getDate() - 3);
    const end = new Date(d); end.setDate(d.getDate() + 3);
    return [start.toISOString().slice(0, 10), clamp(end.toISOString().slice(0, 10))];
  }
  // Month
  const yr = d.getFullYear(), mo = d.getMonth();
  const start = new Date(yr, mo, 1);
  const end = new Date(yr, mo + 1, 0);
  return [start.toISOString().slice(0, 10), clamp(end.toISOString().slice(0, 10))];
}

export function computeSummary(days: DayWeather[]): WeatherResult["summary"] {
  const valid = days.filter(d => d.tempC !== null);
  const temps = valid.map(d => d.tempC!);
  const rains = days.map(d => d.precipMm ?? 0);
  const winds = days.filter(d => d.windKmh !== null).map(d => d.windKmh!);
  const hums = days.filter(d => d.humidity !== null).map(d => d.humidity!);
  const clouds = days.filter(d => d.cloudCover !== null).map(d => d.cloudCover!);

  const avg = (a: number[]) => a.length ? a.reduce((x, y) => x + y, 0) / a.length : 0;
  const codes = days.filter(d => d.weatherCode !== null).map(d => d.weatherCode!);
  const codeFreq: Record<number, number> = {};
  codes.forEach(c => { codeFreq[c] = (codeFreq[c] || 0) + 1; });
  const dominantCode = Object.entries(codeFreq).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "0";

  const baseTemps = days.filter(d => d.avgTempC !== null).map(d => d.avgTempC!);
  const baseRains = days.map(d => d.avgPrecipMm ?? 0);
  const baseAvgTemp = avg(baseTemps);
  const baseAvgRain = baseRains.reduce((a, b) => a + b, 0);
  const actualAvgTemp = avg(temps);
  const actualTotalRain = rains.reduce((a, b) => a + b, 0);

  return {
    avgTemp: actualAvgTemp,
    maxTemp: temps.length ? Math.max(...temps) : 0,
    minTemp: temps.length ? Math.min(...temps) : 0,
    totalRainMm: actualTotalRain,
    rainDays: rains.filter(r => r >= 1).length,
    avgWind: avg(winds),
    maxWind: winds.length ? Math.max(...winds) : 0,
    avgHumidity: avg(hums),
    avgCloud: avg(clouds),
    dominantCode: parseInt(dominantCode),
    baselineAvgTemp: baseAvgTemp,
    baselineAvgRain: baseAvgRain,
    tempDelta: actualAvgTemp - baseAvgTemp,
    rainDelta: actualTotalRain - baseAvgRain,
  };
}
