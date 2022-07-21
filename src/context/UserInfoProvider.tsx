import { UserInfo } from "@authgear/react-native";
import React, { createContext, useContext, useState } from "react";

interface userInfoContextProviderValue {
  userInfo: UserInfo | null;
  setUserInfo: React.Dispatch<React.SetStateAction<UserInfo | null>>;
}

const userInfoContext = createContext<userInfoContextProviderValue>({
  userInfo: null,
  setUserInfo: () => {},
});

interface UserInfoProviderProps {
  children: React.ReactNode;
}

const UserInfoProvider: React.FC<UserInfoProviderProps> = ({ children }) => {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);

  return (
    <userInfoContext.Provider value={{ userInfo, setUserInfo }}>
      {children}
    </userInfoContext.Provider>
  );
};

export const useUserInfo = () => useContext(userInfoContext);

export default UserInfoProvider;
