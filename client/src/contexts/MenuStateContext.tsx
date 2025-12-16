import { createContext, useContext, useState, ReactNode } from 'react';

interface MenuStateContextType {
  notificationsOpen: boolean;
  setNotificationsOpen: (open: boolean) => void;
  messagesOpen: boolean;
  setMessagesOpen: (open: boolean) => void;
}

const MenuStateContext = createContext<MenuStateContextType | undefined>(undefined);

export const MenuStateProvider = ({ children }: { children: ReactNode }) => {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [messagesOpen, setMessagesOpen] = useState(false);

  return (
    <MenuStateContext.Provider
      value={{
        notificationsOpen,
        setNotificationsOpen,
        messagesOpen,
        setMessagesOpen
      }}
    >
      {children}
    </MenuStateContext.Provider>
  );
};

export const useMenuState = () => {
  const context = useContext(MenuStateContext);
  if (!context) {
    throw new Error('useMenuState must be used within MenuStateProvider');
  }
  return context;
};






