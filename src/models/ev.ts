import mongoose, { Schema } from 'mongoose';

export interface IEV {
  brand: string;
  model: string;
  trim: string;
  price: number; // in THB
  image: string;
  gallery?: string[];
  bodyType: 'Sedan' | 'SUV' | 'Hatchback' | 'MPV' | 'Others';
  warrantyYears: number;
  warrantyKm: number;
  
  // Dimensions
  length: number; // mm
  width: number; // mm
  height: number; // mm
  wheelbase: number; // mm
  cargoVolume: number; // Liters
  frunkVolume: number; // Liters (0 if none)
  
  // Performance
  horsepower: number; // HP
  torque: number; // Nm
  acceleration0To100: number; // seconds
  topSpeed: number; // km/h
  driveType: 'RWD' | 'FWD' | 'AWD';
  
  // Battery & Range
  batteryCapacity: number; // kWh
  batteryType: 'LFP' | 'NMC' | 'Others';
  rangeWLTP: number; // km
  rangeNEDC: number; // km
  rangeCLTC: number; // km
  
  // Charging & Tech
  acChargePower: number; // kW
  dcChargePower: number; // kW
  voltageArchitecture: '400V' | '800V';
  v2lSupport: boolean;
  v2lPower: number; // kW (0 if not supported)

  // ADAS (Advanced Driver Assistance Systems)
  adasLevel: number; // 0-3 (0=none, 1=basic, 2=advanced, 3=full semi-auto)
  adaptiveCruiseControl: boolean;
  laneKeepAssist: boolean;
  autoEmergencyBraking: boolean;
  blindSpotMonitor: boolean;
  autoParking: boolean;
  adasFeatures: string; // comma-separated list of additional features
  
  createdAt?: Date;
  updatedAt?: Date;
}


const EVSchema = new Schema<IEV>(
  {
    brand: { type: String, required: true, trim: true },
    model: { type: String, required: true, trim: true },
    trim: { type: String, required: true, trim: true },
    price: { type: Number, required: true },
    image: { type: String, required: true },
    gallery: { type: [String], default: [] },
    bodyType: { 
      type: String, 
      enum: ['Sedan', 'SUV', 'Hatchback', 'MPV', 'Others'], 
      required: true 
    },
    warrantyYears: { type: Number, required: true },
    warrantyKm: { type: Number, required: true },
    
    // Dimensions
    length: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true },
    wheelbase: { type: Number, required: true },
    cargoVolume: { type: Number, required: true },
    frunkVolume: { type: Number, default: 0 },
    
    // Performance
    horsepower: { type: Number, required: true },
    torque: { type: Number, required: true },
    acceleration0To100: { type: Number, required: true },
    topSpeed: { type: Number, required: true },
    driveType: { type: String, enum: ['RWD', 'FWD', 'AWD'], required: true },
    
    // Battery & Range
    batteryCapacity: { type: Number, required: true },
    batteryType: { type: String, enum: ['LFP', 'NMC', 'Others'], required: true },
    rangeWLTP: { type: Number, default: 0 },
    rangeNEDC: { type: Number, default: 0 },
    rangeCLTC: { type: Number, default: 0 },
    
    // Charging
    acChargePower: { type: Number, required: true },
    dcChargePower: { type: Number, required: true },
    voltageArchitecture: { type: String, enum: ['400V', '800V'], required: true },
    v2lSupport: { type: Boolean, default: false },
    v2lPower: { type: Number, default: 0 },

    // ADAS
    adasLevel: { type: Number, default: 0 },
    adaptiveCruiseControl: { type: Boolean, default: false },
    laneKeepAssist: { type: Boolean, default: false },
    autoEmergencyBraking: { type: Boolean, default: false },
    blindSpotMonitor: { type: Boolean, default: false },
    autoParking: { type: Boolean, default: false },
    adasFeatures: { type: String, default: '' },
  },
  { timestamps: true }
);

// Prevent compiling model multiple times
delete mongoose.models.EV;
const EV = mongoose.models.EV || mongoose.model<IEV>('EV', EVSchema);

export default EV;
