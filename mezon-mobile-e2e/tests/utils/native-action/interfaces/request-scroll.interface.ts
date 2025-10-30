export interface IRequestScroll {
  direction: 'down' | 'up' | 'left' | 'right';
  percent: number;
  speed: number;
  timeout: number;
  containerSelectorAndroid: string;
  containerSelectorIos: string;
  repeats: number;
  pauseMs: number;
}
