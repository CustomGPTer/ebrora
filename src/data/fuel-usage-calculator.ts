// src/data/fuel-usage-calculator.ts
// Fuel Usage Calculator — 145 real machines + 85 generic fallbacks across 18 equipment types
// Extracted from Jonathan Jackson's plant database, December 2025

export interface PlantMachine {
  id: number;
  make: string;
  model: string;
  type: string;
  size: number;
  engineKw: number;
  fuel100: number;
  fuel75: number;
  fuel50: number;
  fuel25: number;
  idle: number;
  fuelType: string;
  emissionStage: string;
  isGeneric?: boolean;
  basedOn?: number;
}

export type DutyCycle = '100' | '75' | '50' | '25';
export type DutyCycleKey = 'fuel100' | 'fuel75' | 'fuel50' | 'fuel25';

export const DUTY_CYCLES: { id: DutyCycle; key: DutyCycleKey; label: string; description: string }[] = [
  { id: '100', key: 'fuel100', label: '100%', description: 'Full load — maximum continuous output' },
  { id: '75', key: 'fuel75', label: '75%', description: 'Heavy duty — typical hard digging or loaded haul' },
  { id: '50', key: 'fuel50', label: '50%', description: 'Medium duty — mixed work with some idle' },
  { id: '25', key: 'fuel25', label: '25%', description: 'Light duty — intermittent use or mostly idle' },
];

export function getFuelRate(machine: PlantMachine, duty: DutyCycle): number {
  switch (duty) {
    case '100': return machine.fuel100;
    case '75': return machine.fuel75;
    case '50': return machine.fuel50;
    case '25': return machine.fuel25;
  }
}

// UK Gov GHG Conversion Factors 2024 — diesel (average biofuel blend)
export const FUEL_CARBON_FACTORS: Record<string, number> = {
  'Diesel': 2.68, // kgCO₂e per litre
  'Electric': 0,
  'Diesel (Hybrid)': 2.68,
  'HVO': 0.195, // Hydrotreated Vegetable Oil (renewable diesel)
};

export const DEFAULT_FUEL_PRICE = 0.75; // £/litre red diesel (UK approx)

export const EQUIPMENT_TYPES: string[] = ["Articulated Dumper", "Backhoe Loader", "Compressor", "Dozer", "Generator", "Large Excavator", "Lighting Tower", "Medium Excavator", "Midi Excavator", "Mini Excavator", "Motor Grader", "Site Dumper", "Skid Steer Loader", "Telehandler", "Track Loader", "Vibratory Roller", "Wheel Loader", "Wheeled Excavator"];

export const PLANT_DATABASE: PlantMachine[] = [
  {id:1,make:"Wacker Neuson",model:"803",type:"Mini Excavator",size:0.99,engineKw:9.9,fuel100:2.7,fuel75:2.1,fuel50:1.5,fuel25:0.9,idle:0.6,fuelType:"Diesel",emissionStage:"Stage V"},
  {id:2,make:"Takeuchi",model:"TB216",type:"Mini Excavator",size:1.68,engineKw:11.1,fuel100:3.0,fuel75:2.3,fuel50:1.7,fuel25:1.1,idle:0.6,fuelType:"Diesel",emissionStage:"Tier 4 Final"},
  {id:3,make:"Hitachi",model:"ZX17U-2",type:"Mini Excavator",size:1.85,engineKw:10.6,fuel100:2.9,fuel75:2.3,fuel50:1.6,fuel25:1.0,idle:0.6,fuelType:"Diesel",emissionStage:"Tier 4 Final"},
  {id:4,make:"JCB",model:"19C-1E",type:"Mini Excavator",size:1.9,engineKw:20.0,fuel100:0,fuel75:0,fuel50:0,fuel25:0,idle:0,fuelType:"Electric",emissionStage:"Zero"},
  {id:5,make:"Hitachi",model:"ZX19U-5A",type:"Mini Excavator",size:1.86,engineKw:10.6,fuel100:2.9,fuel75:2.3,fuel50:1.6,fuel25:1.0,idle:0.6,fuelType:"Diesel",emissionStage:"Tier 4 Final"},
  {id:6,make:"Bobcat",model:"E26",type:"Mini Excavator",size:2.56,engineKw:18.5,fuel100:5.1,fuel75:4.0,fuel50:2.8,fuel25:1.8,idle:0.8,fuelType:"Diesel",emissionStage:"Tier 4"},
  {id:7,make:"Hitachi",model:"ZX26U-5A",type:"Mini Excavator",size:2.7,engineKw:14.5,fuel100:4.0,fuel75:3.1,fuel50:2.2,fuel25:1.4,idle:0.8,fuelType:"Diesel",emissionStage:"Tier 4 Final"},
  {id:8,make:"Hitachi",model:"ZX27-R",type:"Mini Excavator",size:2.79,engineKw:19.1,fuel100:5.2,fuel75:4.1,fuel50:2.9,fuel25:1.8,idle:0.8,fuelType:"Diesel",emissionStage:"Stage IIIA"},
  {id:9,make:"Hitachi",model:"ZX29U-3",type:"Mini Excavator",size:3.23,engineKw:19.7,fuel100:5.4,fuel75:4.2,fuel50:3.0,fuel25:1.9,idle:0.8,fuelType:"Diesel",emissionStage:"Stage IIIA"},
  {id:10,make:"Kubota",model:"U27-4",type:"Mini Excavator",size:2.59,engineKw:15.5,fuel100:4.3,fuel75:3.4,fuel50:2.4,fuel25:1.5,idle:0.8,fuelType:"Diesel",emissionStage:"Tier 4 Final"},
  {id:11,make:"Bobcat",model:"E45",type:"Mini Excavator",size:4.63,engineKw:30.2,fuel100:8.3,fuel75:6.5,fuel50:4.6,fuel25:2.9,idle:1.0,fuelType:"Diesel",emissionStage:"Tier 4"},
  {id:12,make:"Caterpillar",model:"305E2 CR",type:"Mini Excavator",size:5.18,engineKw:30.2,fuel100:7.6,fuel75:5.9,fuel50:4.2,fuel25:2.7,idle:1.0,fuelType:"Diesel",emissionStage:"Tier 4 Final"},
  {id:13,make:"Hitachi",model:"ZX48U-5",type:"Mini Excavator",size:5.06,engineKw:28.2,fuel100:7.7,fuel75:6.0,fuel50:4.2,fuel25:2.7,idle:1.0,fuelType:"Diesel",emissionStage:"Tier 4 Final"},
  {id:14,make:"Hitachi",model:"ZX65USB-5A",type:"Mini Excavator",size:6.29,engineKw:34.1,fuel100:9.3,fuel75:7.3,fuel50:5.1,fuel25:3.3,idle:1.2,fuelType:"Diesel",emissionStage:"Tier 4 Final"},
  {id:15,make:"Kubota",model:"U55-4",type:"Mini Excavator",size:5.4,engineKw:35.3,fuel100:9.7,fuel75:7.6,fuel50:5.3,fuel25:3.4,idle:1.2,fuelType:"Diesel",emissionStage:"Tier 4 Final"},
  {id:16,make:"Caterpillar",model:"308E2 SBRP",type:"Mini Excavator",size:8.4,engineKw:48.5,fuel100:12.1,fuel75:9.4,fuel50:6.7,fuel25:4.2,idle:1.5,fuelType:"Diesel",emissionStage:"Tier 4 Final"},
  {id:17,make:"Caterpillar",model:"308 NGH",type:"Mini Excavator",size:9.38,engineKw:48.5,fuel100:12.1,fuel75:9.4,fuel50:6.7,fuel25:4.2,idle:1.5,fuelType:"Diesel",emissionStage:"Tier 4 Final"},
  {id:18,make:"Caterpillar",model:"301.5",type:"Mini Excavator",size:1.74,engineKw:15.7,fuel100:3.9,fuel75:3.0,fuel50:2.1,fuel25:1.4,idle:0.7,fuelType:"Diesel",emissionStage:"Tier 4 Final"},
  {id:19,make:"Hitachi",model:"ZX26U-6",type:"Mini Excavator",size:2.72,engineKw:15.6,fuel100:4.3,fuel75:3.4,fuel50:2.4,fuel25:1.5,idle:0.8,fuelType:"Diesel",emissionStage:"Stage V"},
  {id:20,make:"Caterpillar",model:"302.7",type:"Mini Excavator",size:2.67,engineKw:17.6,fuel100:4.4,fuel75:3.4,fuel50:2.4,fuel25:1.5,idle:0.8,fuelType:"Diesel",emissionStage:"Tier 4 Final"},
  {id:21,make:"Caterpillar",model:"308 CR",type:"Mini Excavator",size:8.0,engineKw:52.4,fuel100:13.7,fuel75:10.7,fuel50:7.5,fuel25:4.5,idle:1.5,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:22,make:"Case",model:"CX145D SR",type:"Midi Excavator",size:13.0,engineKw:76.4,fuel100:20.0,fuel75:15.6,fuel50:11.0,fuel25:7.0,idle:2.0,fuelType:"Diesel",emissionStage:"Tier 4 Final"},
  {id:23,make:"Caterpillar",model:"313",type:"Midi Excavator",size:13.0,engineKw:80.9,fuel100:21.2,fuel75:16.5,fuel50:11.7,fuel25:7.4,idle:2.0,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:24,make:"Kobelco",model:"SK140",type:"Midi Excavator",size:13.0,engineKw:78.6,fuel100:20.6,fuel75:16.1,fuel50:11.3,fuel25:7.2,idle:2.0,fuelType:"Diesel",emissionStage:"Tier 4 Final"},
  {id:25,make:"Hitachi",model:"ZX135US-6",type:"Midi Excavator",size:13.0,engineKw:78.5,fuel100:20.5,fuel75:16.0,fuel50:11.3,fuel25:7.2,idle:2.0,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:26,make:"Komatsu",model:"PC138US-11",type:"Midi Excavator",size:13.0,engineKw:72.6,fuel100:19.0,fuel75:14.8,fuel50:10.5,fuel25:6.7,idle:2.0,fuelType:"Diesel",emissionStage:"Stage IV"},
  {id:27,make:"JCB",model:"140X",type:"Midi Excavator",size:14.0,engineKw:81.0,fuel100:21.2,fuel75:16.5,fuel50:11.7,fuel25:7.4,idle:2.0,fuelType:"Diesel",emissionStage:"Stage V"},
  {id:28,make:"Blue Badger",model:"Tunneller",type:"Midi Excavator",size:14.5,engineKw:53.7,fuel100:14.1,fuel75:11.0,fuel50:7.8,fuel25:4.9,idle:2.0,fuelType:"Diesel",emissionStage:"N/A"},
  {id:29,make:"Caterpillar",model:"315F L",type:"Midi Excavator",size:15.0,engineKw:74.0,fuel100:19.4,fuel75:15.1,fuel50:10.7,fuel25:6.8,idle:2.0,fuelType:"Diesel",emissionStage:"Tier 4 Final"},
  {id:30,make:"Caterpillar",model:"315",type:"Midi Excavator",size:15.0,engineKw:74.0,fuel100:19.4,fuel75:15.1,fuel50:10.7,fuel25:6.8,idle:2.0,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:31,make:"JCB",model:"220X",type:"Medium Excavator",size:20.0,engineKw:129.0,fuel100:33.8,fuel75:26.4,fuel50:18.6,fuel25:11.8,idle:2.5,fuelType:"Diesel",emissionStage:"Stage V"},
  {id:32,make:"Caterpillar",model:"320 GC",type:"Medium Excavator",size:20.0,engineKw:109.0,fuel100:28.6,fuel75:22.3,fuel50:15.7,fuel25:10.0,idle:2.5,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:33,make:"Caterpillar",model:"320-07",type:"Medium Excavator",size:20.0,engineKw:121.0,fuel100:31.7,fuel75:24.7,fuel50:17.4,fuel25:11.1,idle:2.5,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:34,make:"Komatsu",model:"PC210LC-10",type:"Medium Excavator",size:20.0,engineKw:123.0,fuel100:32.3,fuel75:25.2,fuel50:17.8,fuel25:11.3,idle:2.5,fuelType:"Diesel",emissionStage:"Tier 4 Interim"},
  {id:35,make:"Komatsu",model:"HB215LC-3",type:"Medium Excavator",size:20.0,engineKw:110.0,fuel100:28.9,fuel75:22.5,fuel50:15.9,fuel25:10.1,idle:2.5,fuelType:"Diesel",emissionStage:"Tier 4 Final"},
  {id:36,make:"Doosan",model:"DX235LC",type:"Medium Excavator",size:20.0,engineKw:124.0,fuel100:32.5,fuel75:25.4,fuel50:17.9,fuel25:11.4,idle:2.5,fuelType:"Diesel",emissionStage:"Tier 4 Final"},
  {id:37,make:"Hitachi",model:"ZX225US-6",type:"Medium Excavator",size:20.0,engineKw:122.0,fuel100:32.0,fuel75:25.0,fuel50:17.6,fuel25:11.2,idle:2.5,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:38,make:"Komatsu",model:"PC228USLC-11",type:"Medium Excavator",size:25.0,engineKw:123.0,fuel100:32.3,fuel75:25.2,fuel50:17.8,fuel25:11.3,idle:3.0,fuelType:"Diesel",emissionStage:"Stage V"},
  {id:39,make:"Caterpillar",model:"325",type:"Medium Excavator",size:25.0,engineKw:128.0,fuel100:33.6,fuel75:26.2,fuel50:18.5,fuel25:11.8,idle:3.0,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:40,make:"Case",model:"CX245D SR",type:"Medium Excavator",size:25.0,engineKw:120.0,fuel100:31.5,fuel75:24.6,fuel50:17.3,fuel25:11.0,idle:3.0,fuelType:"Diesel",emissionStage:"Tier 4 Final"},
  {id:41,make:"Caterpillar",model:"330-07",type:"Large Excavator",size:30.0,engineKw:204.0,fuel100:53.6,fuel75:41.8,fuel50:29.5,fuel25:18.8,idle:3.0,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:42,make:"Hyundai",model:"HX300L",type:"Large Excavator",size:30.0,engineKw:225.0,fuel100:59.1,fuel75:46.1,fuel50:32.5,fuel25:20.7,idle:3.0,fuelType:"Diesel",emissionStage:"Stage V"},
  {id:43,make:"Komatsu",model:"PC290LC-11",type:"Large Excavator",size:30.0,engineKw:147.0,fuel100:38.6,fuel75:30.1,fuel50:21.2,fuel25:13.5,idle:3.0,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:44,make:"Caterpillar",model:"336-07",type:"Large Excavator",size:36.0,engineKw:232.0,fuel100:60.9,fuel75:47.5,fuel50:33.5,fuel25:21.3,idle:3.5,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:45,make:"Komatsu",model:"HB365LC-3",type:"Large Excavator",size:36.0,engineKw:201.0,fuel100:52.8,fuel75:41.2,fuel50:29.0,fuel25:18.5,idle:3.5,fuelType:"Diesel",emissionStage:"Tier 4 Final"},
  {id:46,make:"Caterpillar",model:"335F L",type:"Large Excavator",size:40.0,engineKw:204.0,fuel100:53.6,fuel75:41.8,fuel50:29.5,fuel25:18.8,idle:3.5,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:47,make:"Caterpillar",model:"352-07",type:"Large Excavator",size:50.0,engineKw:330.0,fuel100:86.6,fuel75:67.6,fuel50:47.6,fuel25:30.3,idle:4.0,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:48,make:"Caterpillar",model:"352F",type:"Large Excavator",size:50.0,engineKw:317.0,fuel100:83.2,fuel75:64.9,fuel50:45.8,fuel25:29.1,idle:4.0,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage IV"},
  {id:49,make:"Hitachi",model:"ZX490LC-6",type:"Large Excavator",size:50.0,engineKw:270.0,fuel100:70.9,fuel75:55.3,fuel50:39.0,fuel25:24.8,idle:4.0,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage IV"},
  {id:50,make:"Komatsu",model:"PC700LC-11",type:"Large Excavator",size:70.0,engineKw:327.0,fuel100:85.9,fuel75:67.0,fuel50:47.2,fuel25:30.1,idle:5.0,fuelType:"Diesel",emissionStage:"Stage V"},
  {id:51,make:"Caterpillar",model:"374F",type:"Large Excavator",size:75.0,engineKw:352.0,fuel100:92.4,fuel75:72.1,fuel50:50.8,fuel25:32.3,idle:5.5,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage IV"},
  {id:52,make:"Caterpillar",model:"374-07",type:"Large Excavator",size:75.0,engineKw:361.0,fuel100:94.8,fuel75:74.0,fuel50:52.1,fuel25:33.2,idle:5.5,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:53,make:"Takeuchi",model:"TB295W",type:"Wheeled Excavator",size:9.0,engineKw:85.0,fuel100:22.3,fuel75:17.4,fuel50:12.3,fuel25:7.8,idle:1.5,fuelType:"Diesel",emissionStage:"Stage V"},
  {id:54,make:"Wacker Neuson",model:"EW65",type:"Wheeled Excavator",size:8.0,engineKw:56.0,fuel100:14.7,fuel75:11.5,fuel50:8.1,fuel25:5.1,idle:1.5,fuelType:"Diesel",emissionStage:"Stage V"},
  {id:55,make:"Wacker Neuson",model:"EW100",type:"Wheeled Excavator",size:10.0,engineKw:100.0,fuel100:26.3,fuel75:20.5,fuel50:14.4,fuel25:9.2,idle:2.0,fuelType:"Diesel",emissionStage:"Stage V"},
  {id:56,make:"JCB",model:"Hydradig 110W",type:"Wheeled Excavator",size:11.0,engineKw:81.0,fuel100:21.3,fuel75:16.6,fuel50:11.7,fuel25:7.4,idle:2.0,fuelType:"Diesel",emissionStage:"Stage V"},
  {id:57,make:"Komatsu",model:"PW118",type:"Wheeled Excavator",size:13.0,engineKw:72.0,fuel100:18.9,fuel75:14.7,fuel50:10.4,fuel25:6.6,idle:2.0,fuelType:"Diesel",emissionStage:"Stage IV"},
  {id:58,make:"Komatsu",model:"PW148",type:"Wheeled Excavator",size:16.0,engineKw:90.0,fuel100:23.6,fuel75:18.4,fuel50:13.0,fuel25:8.3,idle:2.5,fuelType:"Diesel",emissionStage:"Stage IV"},
  {id:59,make:"Caterpillar",model:"M314F",type:"Wheeled Excavator",size:16.0,engineKw:105.0,fuel100:27.6,fuel75:21.5,fuel50:15.2,fuel25:9.7,idle:2.5,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage IV"},
  {id:60,make:"Volvo",model:"EWR130E",type:"Wheeled Excavator",size:13.0,engineKw:90.0,fuel100:23.6,fuel75:18.4,fuel50:13.0,fuel25:8.3,idle:2.0,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:61,make:"Doosan",model:"DX140W",type:"Wheeled Excavator",size:14.0,engineKw:102.0,fuel100:26.8,fuel75:20.9,fuel50:14.7,fuel25:9.4,idle:2.0,fuelType:"Diesel",emissionStage:"Stage V"},
  {id:62,make:"Caterpillar",model:"M315",type:"Wheeled Excavator",size:15.0,engineKw:110.0,fuel100:28.9,fuel75:22.5,fuel50:15.9,fuel25:10.1,idle:2.0,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:63,make:"Hitachi",model:"ZX140W-6",type:"Wheeled Excavator",size:15.0,engineKw:90.5,fuel100:23.8,fuel75:18.6,fuel50:13.1,fuel25:8.3,idle:2.0,fuelType:"Diesel",emissionStage:"Stage V"},
  {id:64,make:"Volvo",model:"EW160E",type:"Wheeled Excavator",size:16.0,engineKw:115.0,fuel100:30.2,fuel75:23.6,fuel50:16.6,fuel25:10.6,idle:2.5,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage IV"},
  {id:65,make:"JCB",model:"JS145W",type:"Wheeled Excavator",size:15.0,engineKw:93.0,fuel100:24.4,fuel75:19.0,fuel50:13.4,fuel25:8.5,idle:2.0,fuelType:"Diesel",emissionStage:"Stage V"},
  {id:66,make:"Komatsu",model:"PW160-11",type:"Wheeled Excavator",size:16.0,engineKw:110.0,fuel100:28.9,fuel75:22.5,fuel50:15.9,fuel25:10.1,idle:2.5,fuelType:"Diesel",emissionStage:"Stage V"},
  {id:67,make:"Caterpillar",model:"M317",type:"Wheeled Excavator",size:17.0,engineKw:128.0,fuel100:33.6,fuel75:26.2,fuel50:18.5,fuel25:11.8,idle:2.5,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:68,make:"Volvo",model:"EW180E",type:"Wheeled Excavator",size:18.0,engineKw:129.0,fuel100:33.9,fuel75:26.4,fuel50:18.6,fuel25:11.9,idle:2.5,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage IV"},
  {id:69,make:"Hitachi",model:"ZX190W-6",type:"Wheeled Excavator",size:19.0,engineKw:121.0,fuel100:31.8,fuel75:24.8,fuel50:17.5,fuel25:11.1,idle:2.5,fuelType:"Diesel",emissionStage:"Stage V"},
  {id:70,make:"Komatsu",model:"PW180-11",type:"Wheeled Excavator",size:18.0,engineKw:123.0,fuel100:32.3,fuel75:25.2,fuel50:17.8,fuel25:11.3,idle:2.5,fuelType:"Diesel",emissionStage:"Stage V"},
  {id:71,make:"Caterpillar",model:"M320",type:"Wheeled Excavator",size:20.0,engineKw:143.0,fuel100:37.6,fuel75:29.3,fuel50:20.7,fuel25:13.2,idle:3.0,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:72,make:"Volvo",model:"EW210E",type:"Wheeled Excavator",size:21.0,engineKw:143.0,fuel100:37.6,fuel75:29.3,fuel50:20.7,fuel25:13.2,idle:3.0,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:73,make:"Thwaites",model:"1T Hi-Tip",type:"Site Dumper",size:1.0,engineKw:18.4,fuel100:4.8,fuel75:3.7,fuel50:2.6,fuel25:1.7,idle:0.8,fuelType:"Diesel",emissionStage:"Stage V"},
  {id:74,make:"Terex",model:"TA1EH",type:"Site Dumper",size:1.0,engineKw:18.5,fuel100:4.9,fuel75:3.8,fuel50:2.7,fuel25:1.7,idle:0.8,fuelType:"Diesel",emissionStage:"Tier 4 Final"},
  {id:75,make:"Thwaites",model:"3T",type:"Site Dumper",size:3.0,engineKw:33.0,fuel100:8.7,fuel75:6.8,fuel50:4.8,fuel25:3.0,idle:1.0,fuelType:"Diesel",emissionStage:"Stage V"},
  {id:76,make:"Ausa",model:"D350AHG",type:"Site Dumper",size:3.5,engineKw:36.4,fuel100:9.6,fuel75:7.5,fuel50:5.3,fuel25:3.4,idle:1.0,fuelType:"Diesel",emissionStage:"Tier 4 Final"},
  {id:77,make:"Thwaites",model:"6T",type:"Site Dumper",size:6.0,engineKw:55.0,fuel100:14.4,fuel75:11.2,fuel50:7.9,fuel25:5.0,idle:1.5,fuelType:"Diesel",emissionStage:"Stage V"},
  {id:78,make:"JCB",model:"6T-2",type:"Site Dumper",size:6.0,engineKw:55.0,fuel100:14.4,fuel75:11.2,fuel50:7.9,fuel25:5.0,idle:1.5,fuelType:"Diesel",emissionStage:"Stage V"},
  {id:79,make:"Ausa",model:"D600APG",type:"Site Dumper",size:6.0,engineKw:55.0,fuel100:14.4,fuel75:11.2,fuel50:7.9,fuel25:5.0,idle:1.5,fuelType:"Diesel",emissionStage:"Tier 4 Final"},
  {id:80,make:"Thwaites",model:"9T",type:"Site Dumper",size:9.0,engineKw:55.0,fuel100:14.4,fuel75:11.2,fuel50:7.9,fuel25:5.0,idle:1.5,fuelType:"Diesel",emissionStage:"Stage V"},
  {id:81,make:"JCB",model:"9T-2",type:"Site Dumper",size:9.0,engineKw:55.0,fuel100:13.8,fuel75:10.8,fuel50:7.6,fuel25:4.8,idle:1.5,fuelType:"Diesel",emissionStage:"Stage V"},
  {id:82,make:"Bell",model:"B25E",type:"Articulated Dumper",size:25.0,engineKw:215.0,fuel100:53.8,fuel75:42.0,fuel50:29.6,fuel25:18.8,idle:3.5,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:83,make:"Volvo",model:"A25G",type:"Articulated Dumper",size:25.0,engineKw:235.0,fuel100:58.8,fuel75:45.9,fuel50:32.3,fuel25:20.6,idle:3.5,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:84,make:"Bell",model:"B30E",type:"Articulated Dumper",size:30.0,engineKw:246.0,fuel100:61.5,fuel75:48.0,fuel50:33.8,fuel25:21.5,idle:4.0,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:85,make:"Volvo",model:"A30G",type:"Articulated Dumper",size:30.0,engineKw:265.0,fuel100:66.3,fuel75:51.7,fuel50:36.5,fuel25:23.2,idle:4.0,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:86,make:"Caterpillar",model:"730",type:"Articulated Dumper",size:30.0,engineKw:276.0,fuel100:69.0,fuel75:53.8,fuel50:38.0,fuel25:24.2,idle:4.0,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:87,make:"Bell",model:"B40E",type:"Articulated Dumper",size:40.0,engineKw:380.0,fuel100:95.0,fuel75:74.1,fuel50:52.3,fuel25:33.3,idle:5.0,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:88,make:"Volvo",model:"A40G",type:"Articulated Dumper",size:40.0,engineKw:350.0,fuel100:87.5,fuel75:68.3,fuel50:48.1,fuel25:30.6,idle:5.0,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:89,make:"Bomag",model:"BW80",type:"Vibratory Roller",size:1.5,engineKw:15.0,fuel100:3.8,fuel75:3.0,fuel50:2.1,fuel25:1.3,idle:0.8,fuelType:"Diesel",emissionStage:"Stage V"},
  {id:90,make:"Hamm",model:"HD8",type:"Vibratory Roller",size:1.5,engineKw:15.0,fuel100:3.8,fuel75:3.0,fuel50:2.1,fuel25:1.3,idle:0.8,fuelType:"Diesel",emissionStage:"Stage V"},
  {id:91,make:"Bomag",model:"BW120",type:"Vibratory Roller",size:2.5,engineKw:25.0,fuel100:6.3,fuel75:4.9,fuel50:3.5,fuel25:2.2,idle:1.0,fuelType:"Diesel",emissionStage:"Stage V"},
  {id:92,make:"Hamm",model:"HD12",type:"Vibratory Roller",size:2.5,engineKw:25.0,fuel100:6.3,fuel75:4.9,fuel50:3.5,fuel25:2.2,idle:1.0,fuelType:"Diesel",emissionStage:"Stage V"},
  {id:93,make:"Bomag",model:"BW177",type:"Vibratory Roller",size:7.0,engineKw:75.0,fuel100:18.8,fuel75:14.7,fuel50:10.3,fuel25:6.6,idle:2.0,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:94,make:"Hamm",model:"H7i",type:"Vibratory Roller",size:7.0,engineKw:75.0,fuel100:18.8,fuel75:14.7,fuel50:10.3,fuel25:6.6,idle:2.0,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:95,make:"Bomag",model:"BW213",type:"Vibratory Roller",size:13.0,engineKw:120.0,fuel100:30.0,fuel75:23.4,fuel50:16.5,fuel25:10.5,idle:3.0,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:96,make:"Hamm",model:"H13i",type:"Vibratory Roller",size:13.0,engineKw:120.0,fuel100:30.0,fuel75:23.4,fuel50:16.5,fuel25:10.5,idle:3.0,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:97,make:"Caterpillar",model:"CS44",type:"Vibratory Roller",size:4.0,engineKw:75.0,fuel100:18.8,fuel75:14.7,fuel50:10.3,fuel25:6.6,idle:1.5,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:98,make:"Caterpillar",model:"CS54",type:"Vibratory Roller",size:10.0,engineKw:98.0,fuel100:24.5,fuel75:19.1,fuel50:13.5,fuel25:8.6,idle:2.5,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:99,make:"Caterpillar",model:"CS64",type:"Vibratory Roller",size:12.0,engineKw:117.0,fuel100:29.3,fuel75:22.9,fuel50:16.1,fuel25:10.3,idle:3.0,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:100,make:"Caterpillar",model:"CS74",type:"Vibratory Roller",size:15.0,engineKw:129.0,fuel100:32.3,fuel75:25.2,fuel50:17.8,fuel25:11.3,idle:3.0,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:101,make:"JCB",model:"525-60",type:"Telehandler",size:6.0,engineKw:55.0,fuel100:13.8,fuel75:10.8,fuel50:7.6,fuel25:4.8,idle:1.5,fuelType:"Diesel",emissionStage:"Stage V"},
  {id:102,make:"JCB",model:"535-95",type:"Telehandler",size:9.0,engineKw:55.0,fuel100:13.8,fuel75:10.8,fuel50:7.6,fuel25:4.8,idle:1.5,fuelType:"Diesel",emissionStage:"Stage V"},
  {id:103,make:"JCB",model:"540-140",type:"Telehandler",size:14.0,engineKw:81.0,fuel100:20.3,fuel75:15.8,fuel50:11.2,fuel25:7.1,idle:2.0,fuelType:"Diesel",emissionStage:"Stage V"},
  {id:104,make:"Manitou",model:"MT1840",type:"Telehandler",size:18.0,engineKw:93.0,fuel100:23.3,fuel75:18.2,fuel50:12.8,fuel25:8.2,idle:2.0,fuelType:"Diesel",emissionStage:"Stage V"},
  {id:105,make:"JCB",model:"3CX",type:"Backhoe Loader",size:9.0,engineKw:68.0,fuel100:17.0,fuel75:13.3,fuel50:9.4,fuel25:6.0,idle:2.0,fuelType:"Diesel",emissionStage:"Stage V"},
  {id:106,make:"Caterpillar",model:"432F2",type:"Backhoe Loader",size:10.0,engineKw:82.0,fuel100:20.5,fuel75:16.0,fuel50:11.3,fuel25:7.2,idle:2.0,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage IV"},
  {id:107,make:"JCB",model:"4CX",type:"Backhoe Loader",size:11.0,engineKw:81.0,fuel100:20.3,fuel75:15.8,fuel50:11.2,fuel25:7.1,idle:2.0,fuelType:"Diesel",emissionStage:"Stage V"},
  {id:108,make:"Caterpillar",model:"444",type:"Backhoe Loader",size:11.0,engineKw:86.0,fuel100:21.5,fuel75:16.8,fuel50:11.8,fuel25:7.5,idle:2.0,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:109,make:"Bobcat",model:"S450",type:"Skid Steer Loader",size:1.3,engineKw:36.0,fuel100:9.0,fuel75:7.0,fuel50:5.0,fuel25:3.2,idle:1.0,fuelType:"Diesel",emissionStage:"Tier 4 Final"},
  {id:110,make:"Bobcat",model:"S650",type:"Skid Steer Loader",size:3.0,engineKw:55.0,fuel100:13.8,fuel75:10.8,fuel50:7.6,fuel25:4.8,idle:1.5,fuelType:"Diesel",emissionStage:"Tier 4 Final"},
  {id:111,make:"Caterpillar",model:"236D",type:"Skid Steer Loader",size:2.0,engineKw:55.0,fuel100:13.8,fuel75:10.8,fuel50:7.6,fuel25:4.8,idle:1.5,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:112,make:"Caterpillar",model:"262D",type:"Skid Steer Loader",size:3.0,engineKw:60.0,fuel100:15.0,fuel75:11.7,fuel50:8.3,fuel25:5.3,idle:1.5,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:113,make:"Caterpillar",model:"953",type:"Track Loader",size:15.0,engineKw:119.0,fuel100:29.8,fuel75:23.2,fuel50:16.4,fuel25:10.4,idle:3.0,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:114,make:"Caterpillar",model:"963",type:"Track Loader",size:20.0,engineKw:144.0,fuel100:36.0,fuel75:28.1,fuel50:19.8,fuel25:12.6,idle:3.0,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:115,make:"Caterpillar",model:"973",type:"Track Loader",size:25.0,engineKw:193.0,fuel100:48.3,fuel75:37.7,fuel50:26.6,fuel25:16.9,idle:3.5,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:116,make:"Caterpillar",model:"914",type:"Wheel Loader",size:7.0,engineKw:74.0,fuel100:18.5,fuel75:14.4,fuel50:10.2,fuel25:6.5,idle:2.0,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:117,make:"Volvo",model:"L60H",type:"Wheel Loader",size:11.0,engineKw:122.0,fuel100:30.5,fuel75:23.8,fuel50:16.8,fuel25:10.7,idle:2.5,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:118,make:"Komatsu",model:"WA320",type:"Wheel Loader",size:15.0,engineKw:127.0,fuel100:31.8,fuel75:24.8,fuel50:17.5,fuel25:11.1,idle:3.0,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage IV"},
  {id:119,make:"Caterpillar",model:"938",type:"Wheel Loader",size:14.0,engineKw:129.0,fuel100:32.3,fuel75:25.2,fuel50:17.8,fuel25:11.3,idle:3.0,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:120,make:"Volvo",model:"L70H",type:"Wheel Loader",size:12.0,engineKw:129.0,fuel100:32.3,fuel75:25.2,fuel50:17.8,fuel25:11.3,idle:2.5,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:121,make:"Caterpillar",model:"D4",type:"Dozer",size:13.0,engineKw:97.0,fuel100:24.3,fuel75:18.9,fuel50:13.4,fuel25:8.5,idle:3.0,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:122,make:"Caterpillar",model:"D5",type:"Dozer",size:17.0,engineKw:127.0,fuel100:31.8,fuel75:24.8,fuel50:17.5,fuel25:11.1,idle:3.5,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:123,make:"Caterpillar",model:"D6",type:"Dozer",size:21.0,engineKw:161.0,fuel100:40.3,fuel75:31.4,fuel50:22.2,fuel25:14.1,idle:4.0,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:124,make:"Komatsu",model:"D61PX-24",type:"Dozer",size:19.0,engineKw:125.0,fuel100:31.3,fuel75:24.4,fuel50:17.2,fuel25:10.9,idle:3.5,fuelType:"Diesel",emissionStage:"Stage V"},
  {id:125,make:"Caterpillar",model:"D6T",type:"Dozer",size:23.0,engineKw:179.0,fuel100:44.8,fuel75:34.9,fuel50:24.6,fuel25:15.7,idle:4.0,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:126,make:"Komatsu",model:"D65PX-18",type:"Dozer",size:21.0,engineKw:164.0,fuel100:41.0,fuel75:32.0,fuel50:22.6,fuel25:14.4,idle:4.0,fuelType:"Diesel",emissionStage:"Stage V"},
  {id:127,make:"Caterpillar",model:"D7E",type:"Dozer",size:26.0,engineKw:175.0,fuel100:43.8,fuel75:34.2,fuel50:24.1,fuel25:15.3,idle:4.5,fuelType:"Diesel (Hybrid)",emissionStage:"Tier 4 Final / Stage V"},
  {id:128,make:"Caterpillar",model:"D8T",type:"Dozer",size:39.0,engineKw:264.0,fuel100:66.0,fuel75:51.5,fuel50:36.3,fuel25:23.1,idle:5.0,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:129,make:"Komatsu",model:"D85PX-18",type:"Dozer",size:27.0,engineKw:197.0,fuel100:49.3,fuel75:38.5,fuel50:27.1,fuel25:17.3,idle:4.5,fuelType:"Diesel",emissionStage:"Stage V"},
  {id:130,make:"Caterpillar",model:"D9",type:"Dozer",size:50.0,engineKw:306.0,fuel100:76.5,fuel75:59.7,fuel50:42.1,fuel25:26.8,idle:5.5,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:131,make:"Caterpillar",model:"120",type:"Motor Grader",size:14.0,engineKw:115.0,fuel100:28.8,fuel75:22.5,fuel50:15.8,fuel25:10.1,idle:3.0,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:132,make:"Caterpillar",model:"140",type:"Motor Grader",size:17.0,engineKw:134.0,fuel100:33.5,fuel75:26.1,fuel50:18.4,fuel25:11.7,idle:3.5,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:133,make:"Volvo",model:"G946",type:"Motor Grader",size:16.0,engineKw:145.0,fuel100:36.3,fuel75:28.3,fuel50:20.0,fuel25:12.7,idle:3.5,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:134,make:"Doosan",model:"7/41",type:"Compressor",size:150.0,engineKw:26.0,fuel100:6.5,fuel75:5.1,fuel50:3.6,fuel25:2.3,idle:1.0,fuelType:"Diesel",emissionStage:"Stage V"},
  {id:135,make:"Atlas Copco",model:"XAS67",type:"Compressor",size:200.0,engineKw:36.0,fuel100:9.0,fuel75:7.0,fuel50:5.0,fuel25:3.2,idle:1.0,fuelType:"Diesel",emissionStage:"Stage V"},
  {id:136,make:"Doosan",model:"7/71",type:"Compressor",size:250.0,engineKw:36.0,fuel100:9.0,fuel75:7.0,fuel50:5.0,fuel25:3.2,idle:1.0,fuelType:"Diesel",emissionStage:"Stage V"},
  {id:137,make:"SDMO",model:"J22",type:"Generator",size:20.0,engineKw:16.0,fuel100:4.0,fuel75:3.1,fuel50:2.2,fuel25:1.4,idle:0.8,fuelType:"Diesel",emissionStage:"Stage V"},
  {id:138,make:"Atlas Copco",model:"QES60",type:"Generator",size:60.0,engineKw:48.0,fuel100:12.0,fuel75:9.4,fuel50:6.6,fuel25:4.2,idle:1.5,fuelType:"Diesel",emissionStage:"Stage V"},
  {id:139,make:"FG Wilson",model:"P110",type:"Generator",size:100.0,engineKw:80.0,fuel100:20.0,fuel75:15.6,fuel50:11.0,fuel25:7.0,idle:2.0,fuelType:"Diesel",emissionStage:"Stage V"},
  {id:140,make:"Caterpillar",model:"DE200",type:"Generator",size:200.0,engineKw:160.0,fuel100:40.0,fuel75:31.2,fuel50:22.0,fuel25:14.0,idle:3.0,fuelType:"Diesel",emissionStage:"Tier 4 Final / Stage V"},
  {id:141,make:"SMC",model:"TL90",type:"Lighting Tower",size:4.0,engineKw:7.0,fuel100:1.8,fuel75:1.4,fuel50:1.0,fuel25:0.6,idle:0.5,fuelType:"Diesel",emissionStage:"Stage V"},
  {id:142,make:"Atlas Copco",model:"HiLight V5+",type:"Lighting Tower",size:4.0,engineKw:8.0,fuel100:2.0,fuel75:1.6,fuel50:1.1,fuel25:0.7,idle:0.5,fuelType:"Diesel",emissionStage:"Stage V"},
  {id:143,make:"Generac",model:"Cube+",type:"Lighting Tower",size:4.0,engineKw:6.0,fuel100:1.5,fuel75:1.2,fuel50:0.8,fuel25:0.5,idle:0.5,fuelType:"Diesel",emissionStage:"Stage V"},
  {id:144,make:"SMC",model:"SLT8000",type:"Lighting Tower",size:8.0,engineKw:10.0,fuel100:2.5,fuel75:1.9,fuel50:1.4,fuel25:0.9,idle:0.6,fuelType:"Diesel",emissionStage:"Stage V"},
  {id:145,make:"Trime",model:"X-Eco",type:"Lighting Tower",size:4.0,engineKw:7.0,fuel100:1.8,fuel75:1.4,fuel50:1.0,fuel25:0.6,idle:0.5,fuelType:"Diesel",emissionStage:"Stage V"},
];

export const GENERIC_MACHINES: PlantMachine[] = [
  {id:9001,make:"Generic",model:"Articulated Dumper 25t",type:"Articulated Dumper",size:25,engineKw:225.0,fuel100:56.3,fuel75:44.0,fuel50:30.9,fuel25:19.7,idle:3.5,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:2},
  {id:9002,make:"Generic",model:"Articulated Dumper 30t",type:"Articulated Dumper",size:30,engineKw:262.3,fuel100:65.6,fuel75:51.2,fuel50:36.1,fuel25:23.0,idle:4.0,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:3},
  {id:9003,make:"Generic",model:"Articulated Dumper 40t",type:"Articulated Dumper",size:40,engineKw:365.0,fuel100:91.2,fuel75:71.2,fuel50:50.2,fuel25:31.9,idle:5.0,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:2},
  {id:9004,make:"Generic",model:"Backhoe Loader 9t",type:"Backhoe Loader",size:9,engineKw:68.0,fuel100:17.0,fuel75:13.3,fuel50:9.4,fuel25:6.0,idle:2.0,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9005,make:"Generic",model:"Backhoe Loader 10t",type:"Backhoe Loader",size:10,engineKw:82.0,fuel100:20.5,fuel75:16.0,fuel50:11.3,fuel25:7.2,idle:2.0,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9006,make:"Generic",model:"Backhoe Loader 11t",type:"Backhoe Loader",size:11,engineKw:83.5,fuel100:20.9,fuel75:16.3,fuel50:11.5,fuel25:7.3,idle:2.0,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:2},
  {id:9007,make:"Generic",model:"Compressor 150t",type:"Compressor",size:150,engineKw:26.0,fuel100:6.5,fuel75:5.1,fuel50:3.6,fuel25:2.3,idle:1.0,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9008,make:"Generic",model:"Compressor 200t",type:"Compressor",size:200,engineKw:36.0,fuel100:9.0,fuel75:7.0,fuel50:5.0,fuel25:3.2,idle:1.0,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9009,make:"Generic",model:"Compressor 250t",type:"Compressor",size:250,engineKw:36.0,fuel100:9.0,fuel75:7.0,fuel50:5.0,fuel25:3.2,idle:1.0,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9010,make:"Generic",model:"Dozer 13t",type:"Dozer",size:13,engineKw:97.0,fuel100:24.3,fuel75:18.9,fuel50:13.4,fuel25:8.5,idle:3.0,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9011,make:"Generic",model:"Dozer 17t",type:"Dozer",size:17,engineKw:127.0,fuel100:31.8,fuel75:24.8,fuel50:17.5,fuel25:11.1,idle:3.5,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9012,make:"Generic",model:"Dozer 19t",type:"Dozer",size:19,engineKw:125.0,fuel100:31.3,fuel75:24.4,fuel50:17.2,fuel25:10.9,idle:3.5,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9013,make:"Generic",model:"Dozer 21t",type:"Dozer",size:21,engineKw:162.5,fuel100:40.6,fuel75:31.7,fuel50:22.4,fuel25:14.2,idle:4.0,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:2},
  {id:9014,make:"Generic",model:"Dozer 23t",type:"Dozer",size:23,engineKw:179.0,fuel100:44.8,fuel75:34.9,fuel50:24.6,fuel25:15.7,idle:4.0,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9015,make:"Generic",model:"Dozer 26t",type:"Dozer",size:26,engineKw:175.0,fuel100:43.8,fuel75:34.2,fuel50:24.1,fuel25:15.3,idle:4.5,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9016,make:"Generic",model:"Dozer 27t",type:"Dozer",size:27,engineKw:197.0,fuel100:49.3,fuel75:38.5,fuel50:27.1,fuel25:17.3,idle:4.5,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9017,make:"Generic",model:"Dozer 39t",type:"Dozer",size:39,engineKw:264.0,fuel100:66.0,fuel75:51.5,fuel50:36.3,fuel25:23.1,idle:5.0,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9018,make:"Generic",model:"Dozer 50t",type:"Dozer",size:50,engineKw:306.0,fuel100:76.5,fuel75:59.7,fuel50:42.1,fuel25:26.8,idle:5.5,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9019,make:"Generic",model:"Generator 20t",type:"Generator",size:20,engineKw:16.0,fuel100:4.0,fuel75:3.1,fuel50:2.2,fuel25:1.4,idle:0.8,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9020,make:"Generic",model:"Generator 60t",type:"Generator",size:60,engineKw:48.0,fuel100:12.0,fuel75:9.4,fuel50:6.6,fuel25:4.2,idle:1.5,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9021,make:"Generic",model:"Generator 100t",type:"Generator",size:100,engineKw:80.0,fuel100:20.0,fuel75:15.6,fuel50:11.0,fuel25:7.0,idle:2.0,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9022,make:"Generic",model:"Generator 200t",type:"Generator",size:200,engineKw:160.0,fuel100:40.0,fuel75:31.2,fuel50:22.0,fuel25:14.0,idle:3.0,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9023,make:"Generic",model:"Large Excavator 30t",type:"Large Excavator",size:30,engineKw:192.0,fuel100:50.4,fuel75:39.3,fuel50:27.7,fuel25:17.7,idle:3.0,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:3},
  {id:9024,make:"Generic",model:"Large Excavator 36t",type:"Large Excavator",size:36,engineKw:216.5,fuel100:56.8,fuel75:44.4,fuel50:31.2,fuel25:19.9,idle:3.5,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:2},
  {id:9025,make:"Generic",model:"Large Excavator 40t",type:"Large Excavator",size:40,engineKw:204.0,fuel100:53.6,fuel75:41.8,fuel50:29.5,fuel25:18.8,idle:3.5,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9026,make:"Generic",model:"Large Excavator 50t",type:"Large Excavator",size:50,engineKw:305.7,fuel100:80.2,fuel75:62.6,fuel50:44.1,fuel25:28.1,idle:4.0,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:3},
  {id:9027,make:"Generic",model:"Large Excavator 70t",type:"Large Excavator",size:70,engineKw:327.0,fuel100:85.9,fuel75:67.0,fuel50:47.2,fuel25:30.1,idle:5.0,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9028,make:"Generic",model:"Large Excavator 75t",type:"Large Excavator",size:75,engineKw:356.5,fuel100:93.6,fuel75:73.0,fuel50:51.5,fuel25:32.8,idle:5.5,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:2},
  {id:9029,make:"Generic",model:"Lighting Tower 4t",type:"Lighting Tower",size:4,engineKw:7.0,fuel100:1.8,fuel75:1.4,fuel50:1.0,fuel25:0.6,idle:0.5,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:4},
  {id:9030,make:"Generic",model:"Lighting Tower 8t",type:"Lighting Tower",size:8,engineKw:10.0,fuel100:2.5,fuel75:1.9,fuel50:1.4,fuel25:0.9,idle:0.6,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9031,make:"Generic",model:"Medium Excavator 20t",type:"Medium Excavator",size:20,engineKw:119.7,fuel100:31.4,fuel75:24.5,fuel50:17.3,fuel25:11.0,idle:2.5,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:7},
  {id:9032,make:"Generic",model:"Medium Excavator 25t",type:"Medium Excavator",size:25,engineKw:123.7,fuel100:32.5,fuel75:25.3,fuel50:17.9,fuel25:11.4,idle:3.0,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:3},
  {id:9033,make:"Generic",model:"Midi Excavator 13t",type:"Midi Excavator",size:13,engineKw:77.4,fuel100:20.3,fuel75:15.8,fuel50:11.2,fuel25:7.1,idle:2.0,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:5},
  {id:9034,make:"Generic",model:"Midi Excavator 14t",type:"Midi Excavator",size:14,engineKw:67.3,fuel100:17.6,fuel75:13.8,fuel50:9.8,fuel25:6.2,idle:2.0,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:2},
  {id:9035,make:"Generic",model:"Midi Excavator 15t",type:"Midi Excavator",size:15,engineKw:74.0,fuel100:19.4,fuel75:15.1,fuel50:10.7,fuel25:6.8,idle:2.0,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:2},
  {id:9036,make:"Generic",model:"Mini Excavator 1t",type:"Mini Excavator",size:1,engineKw:9.9,fuel100:2.7,fuel75:2.1,fuel50:1.5,fuel25:0.9,idle:0.6,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9037,make:"Generic",model:"Mini Excavator 2t",type:"Mini Excavator",size:2,engineKw:12.0,fuel100:3.2,fuel75:2.5,fuel50:1.8,fuel25:1.1,idle:0.6,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:4},
  {id:9038,make:"Generic",model:"Mini Excavator 3t",type:"Mini Excavator",size:3,engineKw:17.2,fuel100:4.7,fuel75:3.7,fuel50:2.6,fuel25:1.6,idle:0.8,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:7},
  {id:9039,make:"Generic",model:"Mini Excavator 5t",type:"Mini Excavator",size:5,engineKw:31.0,fuel100:8.3,fuel75:6.5,fuel50:4.6,fuel25:2.9,idle:1.1,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:4},
  {id:9040,make:"Generic",model:"Mini Excavator 6t",type:"Mini Excavator",size:6,engineKw:34.1,fuel100:9.3,fuel75:7.3,fuel50:5.1,fuel25:3.3,idle:1.2,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9041,make:"Generic",model:"Mini Excavator 8t",type:"Mini Excavator",size:8,engineKw:50.5,fuel100:12.9,fuel75:10.1,fuel50:7.1,fuel25:4.3,idle:1.5,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:2},
  {id:9042,make:"Generic",model:"Mini Excavator 9t",type:"Mini Excavator",size:9,engineKw:48.5,fuel100:12.1,fuel75:9.4,fuel50:6.7,fuel25:4.2,idle:1.5,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9043,make:"Generic",model:"Motor Grader 14t",type:"Motor Grader",size:14,engineKw:115.0,fuel100:28.8,fuel75:22.5,fuel50:15.8,fuel25:10.1,idle:3.0,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9044,make:"Generic",model:"Motor Grader 16t",type:"Motor Grader",size:16,engineKw:145.0,fuel100:36.3,fuel75:28.3,fuel50:20.0,fuel25:12.7,idle:3.5,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9045,make:"Generic",model:"Motor Grader 17t",type:"Motor Grader",size:17,engineKw:134.0,fuel100:33.5,fuel75:26.1,fuel50:18.4,fuel25:11.7,idle:3.5,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9046,make:"Generic",model:"Site Dumper 1t",type:"Site Dumper",size:1,engineKw:18.4,fuel100:4.8,fuel75:3.8,fuel50:2.7,fuel25:1.7,idle:0.8,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:2},
  {id:9047,make:"Generic",model:"Site Dumper 3t",type:"Site Dumper",size:3,engineKw:33.0,fuel100:8.7,fuel75:6.8,fuel50:4.8,fuel25:3.0,idle:1.0,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9048,make:"Generic",model:"Site Dumper 4t",type:"Site Dumper",size:4,engineKw:36.4,fuel100:9.6,fuel75:7.5,fuel50:5.3,fuel25:3.4,idle:1.0,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9049,make:"Generic",model:"Site Dumper 6t",type:"Site Dumper",size:6,engineKw:55.0,fuel100:14.4,fuel75:11.2,fuel50:7.9,fuel25:5.0,idle:1.5,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:3},
  {id:9050,make:"Generic",model:"Site Dumper 9t",type:"Site Dumper",size:9,engineKw:55.0,fuel100:14.1,fuel75:11.0,fuel50:7.8,fuel25:4.9,idle:1.5,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:2},
  {id:9051,make:"Generic",model:"Skid Steer Loader 1t",type:"Skid Steer Loader",size:1,engineKw:36.0,fuel100:9.0,fuel75:7.0,fuel50:5.0,fuel25:3.2,idle:1.0,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9052,make:"Generic",model:"Skid Steer Loader 2t",type:"Skid Steer Loader",size:2,engineKw:55.0,fuel100:13.8,fuel75:10.8,fuel50:7.6,fuel25:4.8,idle:1.5,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9053,make:"Generic",model:"Skid Steer Loader 3t",type:"Skid Steer Loader",size:3,engineKw:57.5,fuel100:14.4,fuel75:11.2,fuel50:8.0,fuel25:5.0,idle:1.5,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:2},
  {id:9054,make:"Generic",model:"Telehandler 6t",type:"Telehandler",size:6,engineKw:55.0,fuel100:13.8,fuel75:10.8,fuel50:7.6,fuel25:4.8,idle:1.5,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9055,make:"Generic",model:"Telehandler 9t",type:"Telehandler",size:9,engineKw:55.0,fuel100:13.8,fuel75:10.8,fuel50:7.6,fuel25:4.8,idle:1.5,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9056,make:"Generic",model:"Telehandler 14t",type:"Telehandler",size:14,engineKw:81.0,fuel100:20.3,fuel75:15.8,fuel50:11.2,fuel25:7.1,idle:2.0,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9057,make:"Generic",model:"Telehandler 18t",type:"Telehandler",size:18,engineKw:93.0,fuel100:23.3,fuel75:18.2,fuel50:12.8,fuel25:8.2,idle:2.0,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9058,make:"Generic",model:"Track Loader 15t",type:"Track Loader",size:15,engineKw:119.0,fuel100:29.8,fuel75:23.2,fuel50:16.4,fuel25:10.4,idle:3.0,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9059,make:"Generic",model:"Track Loader 20t",type:"Track Loader",size:20,engineKw:144.0,fuel100:36.0,fuel75:28.1,fuel50:19.8,fuel25:12.6,idle:3.0,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9060,make:"Generic",model:"Track Loader 25t",type:"Track Loader",size:25,engineKw:193.0,fuel100:48.3,fuel75:37.7,fuel50:26.6,fuel25:16.9,idle:3.5,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9061,make:"Generic",model:"Vibratory Roller 2t",type:"Vibratory Roller",size:2,engineKw:20.0,fuel100:5.0,fuel75:4.0,fuel50:2.8,fuel25:1.8,idle:0.9,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:4},
  {id:9062,make:"Generic",model:"Vibratory Roller 4t",type:"Vibratory Roller",size:4,engineKw:75.0,fuel100:18.8,fuel75:14.7,fuel50:10.3,fuel25:6.6,idle:1.5,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9063,make:"Generic",model:"Vibratory Roller 7t",type:"Vibratory Roller",size:7,engineKw:75.0,fuel100:18.8,fuel75:14.7,fuel50:10.3,fuel25:6.6,idle:2.0,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:2},
  {id:9064,make:"Generic",model:"Vibratory Roller 10t",type:"Vibratory Roller",size:10,engineKw:98.0,fuel100:24.5,fuel75:19.1,fuel50:13.5,fuel25:8.6,idle:2.5,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9065,make:"Generic",model:"Vibratory Roller 12t",type:"Vibratory Roller",size:12,engineKw:117.0,fuel100:29.3,fuel75:22.9,fuel50:16.1,fuel25:10.3,idle:3.0,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9066,make:"Generic",model:"Vibratory Roller 13t",type:"Vibratory Roller",size:13,engineKw:120.0,fuel100:30.0,fuel75:23.4,fuel50:16.5,fuel25:10.5,idle:3.0,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:2},
  {id:9067,make:"Generic",model:"Vibratory Roller 15t",type:"Vibratory Roller",size:15,engineKw:129.0,fuel100:32.3,fuel75:25.2,fuel50:17.8,fuel25:11.3,idle:3.0,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9068,make:"Generic",model:"Wheel Loader 7t",type:"Wheel Loader",size:7,engineKw:74.0,fuel100:18.5,fuel75:14.4,fuel50:10.2,fuel25:6.5,idle:2.0,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9069,make:"Generic",model:"Wheel Loader 11t",type:"Wheel Loader",size:11,engineKw:122.0,fuel100:30.5,fuel75:23.8,fuel50:16.8,fuel25:10.7,idle:2.5,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9070,make:"Generic",model:"Wheel Loader 12t",type:"Wheel Loader",size:12,engineKw:129.0,fuel100:32.3,fuel75:25.2,fuel50:17.8,fuel25:11.3,idle:2.5,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9071,make:"Generic",model:"Wheel Loader 14t",type:"Wheel Loader",size:14,engineKw:129.0,fuel100:32.3,fuel75:25.2,fuel50:17.8,fuel25:11.3,idle:3.0,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9072,make:"Generic",model:"Wheel Loader 15t",type:"Wheel Loader",size:15,engineKw:127.0,fuel100:31.8,fuel75:24.8,fuel50:17.5,fuel25:11.1,idle:3.0,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9073,make:"Generic",model:"Wheeled Excavator 8t",type:"Wheeled Excavator",size:8,engineKw:56.0,fuel100:14.7,fuel75:11.5,fuel50:8.1,fuel25:5.1,idle:1.5,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9074,make:"Generic",model:"Wheeled Excavator 9t",type:"Wheeled Excavator",size:9,engineKw:85.0,fuel100:22.3,fuel75:17.4,fuel50:12.3,fuel25:7.8,idle:1.5,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9075,make:"Generic",model:"Wheeled Excavator 10t",type:"Wheeled Excavator",size:10,engineKw:100.0,fuel100:26.3,fuel75:20.5,fuel50:14.4,fuel25:9.2,idle:2.0,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9076,make:"Generic",model:"Wheeled Excavator 11t",type:"Wheeled Excavator",size:11,engineKw:81.0,fuel100:21.3,fuel75:16.6,fuel50:11.7,fuel25:7.4,idle:2.0,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9077,make:"Generic",model:"Wheeled Excavator 13t",type:"Wheeled Excavator",size:13,engineKw:81.0,fuel100:21.2,fuel75:16.5,fuel50:11.7,fuel25:7.5,idle:2.0,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:2},
  {id:9078,make:"Generic",model:"Wheeled Excavator 14t",type:"Wheeled Excavator",size:14,engineKw:102.0,fuel100:26.8,fuel75:20.9,fuel50:14.7,fuel25:9.4,idle:2.0,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9079,make:"Generic",model:"Wheeled Excavator 15t",type:"Wheeled Excavator",size:15,engineKw:97.8,fuel100:25.7,fuel75:20.0,fuel50:14.1,fuel25:9.0,idle:2.0,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:3},
  {id:9080,make:"Generic",model:"Wheeled Excavator 16t",type:"Wheeled Excavator",size:16,engineKw:105.0,fuel100:27.6,fuel75:21.5,fuel50:15.2,fuel25:9.7,idle:2.5,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:4},
  {id:9081,make:"Generic",model:"Wheeled Excavator 17t",type:"Wheeled Excavator",size:17,engineKw:128.0,fuel100:33.6,fuel75:26.2,fuel50:18.5,fuel25:11.8,idle:2.5,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9082,make:"Generic",model:"Wheeled Excavator 18t",type:"Wheeled Excavator",size:18,engineKw:126.0,fuel100:33.1,fuel75:25.8,fuel50:18.2,fuel25:11.6,idle:2.5,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:2},
  {id:9083,make:"Generic",model:"Wheeled Excavator 19t",type:"Wheeled Excavator",size:19,engineKw:121.0,fuel100:31.8,fuel75:24.8,fuel50:17.5,fuel25:11.1,idle:2.5,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9084,make:"Generic",model:"Wheeled Excavator 20t",type:"Wheeled Excavator",size:20,engineKw:143.0,fuel100:37.6,fuel75:29.3,fuel50:20.7,fuel25:13.2,idle:3.0,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
  {id:9085,make:"Generic",model:"Wheeled Excavator 21t",type:"Wheeled Excavator",size:21,engineKw:143.0,fuel100:37.6,fuel75:29.3,fuel50:20.7,fuel25:13.2,idle:3.0,fuelType:"Diesel",emissionStage:"Generic estimate",isGeneric:true,basedOn:1},
];

export const ALL_MACHINES: PlantMachine[] = [...PLANT_DATABASE, ...GENERIC_MACHINES];

// ─── Compatibility aliases (component uses these names) ──────────
export type Machine = PlantMachine;
export const MACHINES = ALL_MACHINES;
export const CARBON_FACTORS = FUEL_CARBON_FACTORS;
export const DEFAULT_FUEL_COST = DEFAULT_FUEL_PRICE;