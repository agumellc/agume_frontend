import type { ThemeConfig } from 'antd';

export const agumeTheme: ThemeConfig = {
  token: {
    colorPrimary: '#25671E',
    colorPrimaryHover: '#1e5418',
    colorPrimaryActive: '#174010',
    colorPrimaryText: '#25671E',
    borderRadius: 8,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    colorBgContainer: '#ffffff',
    colorBgLayout: '#f8fafc',
    colorBorder: '#e2e8f0',
    colorBorderSecondary: '#f1f5f9',
  },
  components: {
    Table: {
      headerBg: '#f8fafc',
      headerColor: '#475569',
      headerSortActiveBg: '#f1f5f9',
      rowHoverBg: '#f8fafc',
      borderColor: '#e2e8f0',
    },
    Button: {
      primaryColor: '#ffffff',
    },
    Card: {
      headerBg: 'transparent',
      headerFontSize: 15,
    },
    Input: {
      activeBorderColor: '#25671E',
      hoverBorderColor: '#94a3b8',
    },
    Select: {
      optionSelectedBg: '#f0fdf4',
    },
  },
};
