/*
 * [SCREEN]:{
 * 	[SECTION]:{
 * 		[SUB_SECTION]: {
 * 			COMPONENT: {
 * 				id: ''
 * 			}
 * 		}
 * 	}
 * }
 * */

export const DATA_E2E_IDENTIFIER = {
  homepage: {
    header: {
      link: {
        home: '',
        feature: '',
        developers: '',
      },
      button: {
        login: '',
        menu: '',
      },
      container: {
        navigation: '',
      },
    },
    main_page: {
      container: '',
      heading: {
        title: '',
      },
    },
    layout: {
      title: {
        features: '',
      },
    },
    footer: {
      text: {
        copyright: '',
      },
    },
  },
  chat: {
    channel_message: {
      thread_name_input: {
        thread_box: '',
      },
    },
    mention: {
      input: {
        mention_thread: '',
        mention_topic: '',
        mention_clan: '',
      },
    },
  },
};

type DotNestedKeys<T> = T extends object
  ? {
      [K in Extract<keyof T, string>]: T[K] extends object ? K | `${K}.${DotNestedKeys<T[K]>}` : K;
    }[Extract<keyof T, string>]
  : never;

export type E2eKeyType = DotNestedKeys<typeof DATA_E2E_IDENTIFIER>;
