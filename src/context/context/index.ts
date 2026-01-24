import { createContext, Dispatch } from "react";

interface Setting {
  forceJoinChannel: boolean;
  joinGift: number;
  referralGift: any;
  botName: string;
  community: string;
  support: string;
  referralPrize: any;
  daily: any;
  upgrade: any;
}

export interface Task {
  id: number;
  title: string;
  desc: string | null;
  image: any;
  link: string;
  reward: any;
  status: boolean;
  force: boolean;
  type: string;
}

interface User {
  id: number;
  wallet: string;
  fullName: string;
  status: string;
  level: number;
  boost: number;
  friends: number;
  remainFriends: number;
  createdAt: string;
  updatedAt: string;
  links: any[];
}

interface SettingState {
  token: string;
  isLoged: boolean;
  lang: string;
  theme: string;
  uuid: string;
  landing: boolean;
}

interface AppState {
  user: User;
  setting: Setting;
  tasks: Task[];
  userTask: number[];
  wallet: any[];
  leaders: any;
  assets: any[];
  pairs: any[];
  tokens: any[];
  ref: number;
}

interface MemoryState {
  friends: any;
  swipe: any;
  tokens: any[];
  missions: any[];
  userMissions: any[];
  leaders: any;
}

// Define the context type
export interface StoreContextType {
  setting: SettingState;
  setSetting: Dispatch<any>; // Adjust any as per your action type
  app: AppState;
  setApp: Dispatch<any>; // Adjust any as per your action type
  session: Dispatch<any>;
  setSession: Dispatch<any>; // Adjust any as per your action type
  memory: MemoryState;
  setMemory: Dispatch<any>; // Adjust any as per your action type
}

// Create context with initial value
const storeContext = createContext<StoreContextType | undefined>(undefined);

export default storeContext;
