import { EnvironmentConfig } from '@/config/types';
import dotenv from 'dotenv';

dotenv.config();

/**
 * Persistent authentication configurations for multiple test accounts
 * These are pre-configured authentication states used in Playwright tests
 */
export const persistentAuthConfigs = {
  account1: {
    loadingStatus: '"loaded"',
    session:
      '{"1964889885160509400":{"created":false,"api_url":"https://dev-mezon.nccsoft.vn:7305","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJkNGU1MDU2Zi01YjNjLTRjOTItYWYwOS1hZWY3NTk0Y2QyMjQiLCJ1aWQiOjE5NjQ4ODk4ODUxNjA1MDk0NDAsInVzbiI6ImRhdC5oYXF1b2MrMDEiLCJleHAiOjE3NTgzNDE5NjR9.f6IT36l5bd_Lpk0wXz3ccMVtTn28Gq0Ktit29b7Pd9w","refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJkNGU1MDU2Zi01YjNjLTRjOTItYWYwOS1hZWY3NTk0Y2QyMjQiLCJ1aWQiOjE5NjQ4ODk4ODUxNjA1MDk0NDAsInVzbiI6ImRhdC5oYXF1b2MrMDEiLCJleHAiOjE3NTg4NjAzNjR9.Taeazjyq0TwVXyboyvu4POuSA1HD-gJ1OSZJivnRLIk","created_at":1758255564,"is_remember":false,"refresh_expires_at":1758860364,"expires_at":1758341964,"username":"dat.haquoc+01","user_id":1964889885160509400}}',
    isLogin: 'true',
    isRegistering: '"not loaded"',
    loadingStatusEmail: '"not loaded"',
    redirectUrl: 'null',
    activeAccount: '"1964889885160509400"',
    _persist: '{"version":-1,"rehydrated":true}',
  },
  account2: {
    loadingStatus: '"loaded"',
    session:
      '{"1964890088861077500":{"created":false,"api_url":"https://dev-mezon.nccsoft.vn:7305","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJjY2Y5YzgwOS02YzFlLTRhNzAtOWVjNy0xMGQ4YjBhZjdiZTEiLCJ1aWQiOjE5NjQ4OTAwODg4NjEwNzc1MDQsInVzbiI6ImRhdC5oYXF1b2MrMDIiLCJleHAiOjE3NTc3MzM1ODF9.W2fEA0gz8wLGzbUQ3o602bzjmDInh3m-BRS1tpk6Wkc","refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJjY2Y5YzgwOS02YzFlLTRhNzAtOWVjNy0xMGQ4YjBhZjdiZTEiLCJ1aWQiOjE5NjQ4OTAwODg4NjEwNzc1MDQsInVzbiI6ImRhdC5oYXF1b2MrMDIiLCJleHAiOjE3NTgyNTE5ODF9.BnAU_kqlOi3iI9kmuEYA9PuyFR4A6SVEWHTwgci98Q8","created_at":1757647181,"is_remember":false,"refresh_expires_at":1758251981,"expires_at":1757733581,"username":"dat.haquoc+02","user_id":1964890088861077500}}',
    isLogin: 'true',
    isRegistering: '"not loaded"',
    loadingStatusEmail: '"not loaded"',
    redirectUrl: 'null',
    activeAccount: '"1964890088861077500"',
    _persist: '{"version":-1,"rehydrated":true}',
  },
  account3: {
    loadingStatus: '"loaded"',
    session:
      '{"1964937944108109800":{"created":false,"api_url":"https://dev-mezon.nccsoft.vn:7305","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJkYWVhOTA5ZS0yMzhiLTQyYTUtOTdhZi0wNzNhMWQ4NTg4MzAiLCJ1aWQiOjE5NjQ5Mzc5NDQxMDgxMDk4MjQsInVzbiI6ImRhdC5oYXF1b2MrMDMiLCJleHAiOjE3NTgzNDE5MDJ9.e-nH5dW53zvJGldUXMCXjSJIu4tgEq6Lzz-MITX7zx4","refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJkYWVhOTA5ZS0yMzhiLTQyYTUtOTdhZi0wNzNhMWQ4NTg4MzAiLCJ1aWQiOjE5NjQ5Mzc5NDQxMDgxMDk4MjQsInVzbiI6ImRhdC5oYXF1b2MrMDMiLCJleHAiOjE3NTg4NjAzMDJ9.eIn_LMVhM-sxhpH4GGyBbQHUKoys_Q5DFXkA08TzuX0","created_at":1758255501,"is_remember":false,"refresh_expires_at":1758860302,"expires_at":1758341902,"username":"dat.haquoc+03","user_id":1964937944108109800}}',
    isLogin: 'true',
    isRegistering: '"not loaded"',
    loadingStatusEmail: '"not loaded"',
    redirectUrl: 'null',
    activeAccount: '"1964937944108109800"',
    _persist: '{"version":-1,"rehydrated":true}',
  },
  account4: {
    loadingStatus: '"loaded"',
    session:
      '{"1964952630786527200":{"created":false,"api_url":"https://dev-mezon.nccsoft.vn:7305","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJlZTQxYjBiZi04MDhkLTRlOWYtOWY4YS04OGYyOGUxNWI3ZWIiLCJ1aWQiOjE5NjQ5NTI2MzA3ODY1MjcyMzIsInVzbiI6ImRhdC5oYXF1b2MrMDQiLCJleHAiOjE3NTgzNDE4MjF9.PX9YdVs-y6PZzoi0Hs73nDQW8OFjINe3Q6Qumw7emkQ","refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJlZTQxYjBiZi04MDhkLTRlOWYtOWY4YS04OGYyOGUxNWI3ZWIiLCJ1aWQiOjE5NjQ5NTI2MzA3ODY1MjcyMzIsInVzbiI6ImRhdC5oYXF1b2MrMDQiLCJleHAiOjE3NTg4NjAyMjF9.qLZa60NnjbhhUCfApQ3JGssT2M6wq1usCh7qAexfLvM","created_at":1758255421,"is_remember":false,"refresh_expires_at":1758860221,"expires_at":1758341821,"username":"dat.haquoc+04","user_id":1964952630786527200}}',
    isLogin: 'true',
    isRegistering: '"not loaded"',
    loadingStatusEmail: '"not loaded"',
    redirectUrl: 'null',
    activeAccount: '"1964952630786527200"',
    _persist: '{"version":-1,"rehydrated":true}',
  },
  account5: {
    loadingStatus: '"loaded"',
    session:
      '{"1964953116990247000":{"created":false,"api_url":"https://dev-mezon.nccsoft.vn:7305","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiI0ZGUwOGRiNC0yYTJlLTQ3ODctOTM3YS00MWQ1OTM5N2VjNzMiLCJ1aWQiOjE5NjQ5NTMxMTY5OTAyNDY5MTIsInVzbiI6ImRhdC5oYXF1b2MrMDUiLCJleHAiOjE3NTgzNDIwMzV9.mbUjGNVXghwTBq5wb-xOc-PTdIPCBL6yksyv7tJLbtg","refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiI0ZGUwOGRiNC0yYTJlLTQ3ODctOTM3YS00MWQ1OTM5N2VjNzMiLCJ1aWQiOjE5NjQ5NTMxMTY5OTAyNDY5MTIsInVzbiI6ImRhdC5oYXF1b2MrMDUiLCJleHAiOjE3NTg4NjA0MzV9.nu15kHmqRrkiZ-ci8gwOv0tBQuxhuI3utDWyakNs5Nc","created_at":1758255635,"is_remember":false,"refresh_expires_at":1758860435,"expires_at":1758342035,"username":"dat.haquoc+05","user_id":1964953116990247000}}',
    isLogin: 'true',
    isRegistering: '"not loaded"',
    loadingStatusEmail: '"not loaded"',
    redirectUrl: 'null',
    activeAccount: '"1964953116990247000"',
    _persist: '{"version":-1,"rehydrated":true}',
  },
  account6: {
    loadingStatus: '"loaded"',
    session:
      '{"1964953606733959200":{"created":false,"api_url":"https://dev-mezon.nccsoft.vn:7305","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJiMGIwZTc3OS1hY2ZlLTRjMjUtODc3ZS02MTA4ZmVhZGUxNjEiLCJ1aWQiOjE5NjQ5NTM2MDY3MzM5NTkxNjgsInVzbiI6ImRhdC5oYXF1b2MrMDYiLCJleHAiOjE3NTgzNDIwODh9.tXQQ-15Wi__8Gl1DzbkAaxI6eNmUzicLBfCqvE1UAWU","refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJiMGIwZTc3OS1hY2ZlLTRjMjUtODc3ZS02MTA4ZmVhZGUxNjEiLCJ1aWQiOjE5NjQ5NTM2MDY3MzM5NTkxNjgsInVzbiI6ImRhdC5oYXF1b2MrMDYiLCJleHAiOjE3NTg4NjA0ODh9.8mx7yy4r75YwctqZPo5hOOam3m9qPL4YXdHexie_Q8M","created_at":1758255688,"is_remember":false,"refresh_expires_at":1758860488,"expires_at":1758342088,"username":"dat.haquoc+06","user_id":1964953606733959200}}',
    isLogin: 'true',
    isRegistering: '"not loaded"',
    loadingStatusEmail: '"not loaded"',
    redirectUrl: 'null',
    activeAccount: '"1964953606733959200"',
    _persist: '{"version":-1,"rehydrated":true}',
  },
  account7: {
    loadingStatus: '"loaded"',
    session:
      '{"1967789474532298800":{"created":false,"api_url":"https://dev-mezon.nccsoft.vn:7305","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJkZDUwMDVkZi00OGEzLTQ3OWEtOGU1NS03NjU2NTQ4MDM3ZDAiLCJ1aWQiOjE5Njc3ODk0NzQ1MzIyOTg3NTIsInVzbiI6ImRhdC5oYXF1b2MrMDciLCJleHAiOjE3NTg2ODU0MzZ9.Nei5CNBtC_nyLEmUdJeR9RJ2MTFa_4_h9bDXJtVYaCg","refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJkZDUwMDVkZi00OGEzLTQ3OWEtOGU1NS03NjU2NTQ4MDM3ZDAiLCJ1aWQiOjE5Njc3ODk0NzQ1MzIyOTg3NTIsInVzbiI6ImRhdC5oYXF1b2MrMDciLCJleHAiOjE3NTkyMDM4MzZ9.1scwztuWK3IhZ7FKGdIzx_3VJWn_iaPAtObBgMHHmIg","created_at":1758599036,"is_remember":false,"refresh_expires_at":1759203836,"expires_at":1758685436,"username":"dat.haquoc+07","user_id":1967789474532298800}}',
    isLogin: 'true',
    isRegistering: '"not loaded"',
    loadingStatusEmail: '"not loaded"',
    redirectUrl: 'null',
    activeAccount: '"1967789474532298800"',
    _persist: '{"version":-1,"rehydrated":true}',
  },
  'account2-1': {
    loadingStatus: '"loaded"',
    session:
      '{"1967441732656173000":{"created":false,"api_url":"https://dev-mezon.nccsoft.vn:7305","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiIxZGQ4OTM0Ni1lMWNjLTQ4NWItOTZkYy01NTNlN2M0ZTNiNGQiLCJ1aWQiOjE5Njc0NDE3MzI2NTYxNzMwNTYsInVzbiI6ImRhdC5oYXF1b2MrMDItMSIsImV4cCI6MTc1ODUzMzcyMH0.TjfUlp7gbVZI5MsZzMuOGtOFSokk78pKxBDndhYEUog","refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiIxZGQ4OTM0Ni1lMWNjLTQ4NWItOTZkYy01NTNlN2M0ZTNiNGQiLCJ1aWQiOjE5Njc0NDE3MzI2NTYxNzMwNTYsInVzbiI6ImRhdC5oYXF1b2MrMDItMSIsImV4cCI6MTc1OTEzNzkyMH0.dXqVoEt-3P2Ddj6_6j1kOcuFJYR2ioQt5XcDs7s_Icw","created_at":1758533119,"is_remember":false,"refresh_expires_at":1759137920,"expires_at":1758533720,"username":"dat.haquoc+02-1","user_id":1967441732656173000}}',
    isLogin: 'true',
    isRegistering: '"not loaded"',
    loadingStatusEmail: '"not loaded"',
    redirectUrl: 'null',
    activeAccount: '"1967441732656173000"',
    error: '"t.json is not a function"',
    _persist: '{"version":-1,"rehydrated":true}',
  },
  'account2-2': {
    loadingStatus: '"loaded"',
    session:
      '{"1967442215051464700":{"created":false,"api_url":"https://dev-mezon.nccsoft.vn:7305","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJmZmYzNWRhNC00ZmM2LTQ2ODEtYjUzNC00ZDhiMzQyMTUwODQiLCJ1aWQiOjE5Njc0NDIyMTUwNTE0NjQ3MDQsInVzbiI6ImRhdC5oYXF1b2MrMDItMiIsImV4cCI6MTc1ODYxOTY0OH0.J52ZAbPcbZiKeCXcg9LGF7qXMzTzzmWu-fWT0kPmTZg","refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJmZmYzNWRhNC00ZmM2LTQ2ODEtYjUzNC00ZDhiMzQyMTUwODQiLCJ1aWQiOjE5Njc0NDIyMTUwNTE0NjQ3MDQsInVzbiI6ImRhdC5oYXF1b2MrMDItMiIsImV4cCI6MTc1OTEzODA0OH0.XZFLGDAcZ9hGv3dlxH-SitSOKx1V1VwDU4KqFbu3d28","created_at":1758533248,"is_remember":false,"refresh_expires_at":1759138048,"expires_at":1758619648,"username":"dat.haquoc+02-2","user_id":1967442215051464700}}',
    isLogin: 'true',
    isRegistering: '"not loaded"',
    loadingStatusEmail: '"not loaded"',
    redirectUrl: 'null',
    activeAccount: '"1967442215051464700"',
    _persist: '{"version":-1,"rehydrated":true}',
  },
  'account2-3': {
    loadingStatus: '"loaded"',
    session:
      '{"1967442542983123000":{"created":false,"api_url":"https://dev-mezon.nccsoft.vn:7305","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiI5YjUxYmYzOS0yZjA4LTRhNjMtOTBjNy05M2RiZmE0Yzk4NjEiLCJ1aWQiOjE5Njc0NDI1NDI5ODMxMjI5NDQsInVzbiI6ImRhdC5oYXF1b2MrMDItMyIsImV4cCI6MTc1ODYwMzAxNn0.eFgfyqT8FYhfzMo799zMJdIs5R9sgFI-g7dfrBX5ysQ","refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiI5YjUxYmYzOS0yZjA4LTRhNjMtOTBjNy05M2RiZmE0Yzk4NjEiLCJ1aWQiOjE5Njc0NDI1NDI5ODMxMjI5NDQsInVzbiI6ImRhdC5oYXF1b2MrMDItMyIsImV4cCI6MTc1OTEyMTQxNn0.YIHGEsGUlwFkvhpGShTbakE7Pt82-cUwqIvwWZDEwOA","created_at":1758516616,"is_remember":false,"refresh_expires_at":1759121416,"expires_at":1758603016,"username":"dat.haquoc+02-3","user_id":1967442542983123000}}',
    isLogin: 'true',
    isRegistering: '"not loaded"',
    loadingStatusEmail: '"not loaded"',
    redirectUrl: 'null',
    activeAccount: '"1967442542983123000"',
    _persist: '{"version":-1,"rehydrated":true}',
  },
  'account2-4': {
    loadingStatus: '"loaded"',
    session:
      '{"1967442871149662200":{"created":false,"api_url":"https://dev-mezon.nccsoft.vn:7305","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiI4MDQ4OGJiYS1kZjUwLTQyNTctODAzZS0wOWI0NmVjN2FiMTEiLCJ1aWQiOjE5Njc0NDI4NzExNDk2NjIyMDgsInVzbiI6ImRhdC5oYXF1b2MrMDItNCIsImV4cCI6MTc1ODYxOTY5NX0.LJhNLRJtbdmmdBnrT3irhkAoQhRPNV3gKeLm4rGPN9w","refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiI4MDQ4OGJiYS1kZjUwLTQyNTctODAzZS0wOWI0NmVjN2FiMTEiLCJ1aWQiOjE5Njc0NDI4NzExNDk2NjIyMDgsInVzbiI6ImRhdC5oYXF1b2MrMDItNCIsImV4cCI6MTc1OTEzODA5NX0.KLDvZY8k95oPRKs2UG50WUpK9wwoDDgJRi6xId5IcHo","created_at":1758533295,"is_remember":false,"refresh_expires_at":1759138095,"expires_at":1758619695,"username":"dat.haquoc+02-4","user_id":1967442871149662200}}',
    isLogin: 'true',
    isRegistering: '"not loaded"',
    loadingStatusEmail: '"not loaded"',
    redirectUrl: 'null',
    activeAccount: '"1967442871149662200"',
    _persist: '{"version":-1,"rehydrated":true}',
  },
  'account2-5': {
    loadingStatus: '"loaded"',
    session:
      '{"1967443118043172900":{"created":false,"api_url":"https://dev-mezon.nccsoft.vn:7305","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJhNDA4MDkyYS04NDkzLTQwM2YtOWY4NS0xMWNmOTVkYzllYTMiLCJ1aWQiOjE5Njc0NDMxMTgwNDMxNzI4NjQsInVzbiI6ImRhdC5oYXF1b2MrMDItNSIsImV4cCI6MTc1ODYxOTc1MH0.A3GKhF_FypGcsUekDHP9QiNkQOxWQXx7zlwG2ZsxoTY","refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJhNDA4MDkyYS04NDkzLTQwM2YtOWY4NS0xMWNmOTVkYzllYTMiLCJ1aWQiOjE5Njc0NDMxMTgwNDMxNzI4NjQsInVzbiI6ImRhdC5oYXF1b2MrMDItNSIsImV4cCI6MTc1OTEzODE1MH0.KRYCnkeFhF51a08LPEoDd58YIbHYVNPlnuGK-6DuXaA","created_at":1758533350,"is_remember":false,"refresh_expires_at":1759138150,"expires_at":1758619750,"username":"dat.haquoc+02-5","user_id":1967443118043172900}}',
    isLogin: 'true',
    isRegistering: '"not loaded"',
    loadingStatusEmail: '"not loaded"',
    redirectUrl: 'null',
    activeAccount: '"1967443118043172900"',
    _persist: '{"version":-1,"rehydrated":true}',
  },
  account9: {
    loadingStatus: '"loaded"',
    session:
      '{"1968204319014523000":{"created":false,"api_url":"https://dev-mezon.nccsoft.vn:7305","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiI2ZTRlZjU0My1hZWI1LTRiYjUtYTU1Yy00NzM1OTcyMmVhZWYiLCJ1aWQiOjE5NjgyMDQzMTkwMTQ1MjI4ODAsInVzbiI6ImRhdC5oYXF1b2MrMDkiLCJleHAiOjE3NTgxNzgzNzN9.KiK9JExg0bZim8GEPKPqaUxQOnd9rR7L3PIY3GHWQno","refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiI2ZTRlZjU0My1hZWI1LTRiYjUtYTU1Yy00NzM1OTcyMmVhZWYiLCJ1aWQiOjE5NjgyMDQzMTkwMTQ1MjI4ODAsInVzbiI6ImRhdC5oYXF1b2MrMDkiLCJleHAiOjE3NTg2OTY3NzN9.owgDZFcZ6TDdjevIwmDHEq0AnMQGh3K2XwE6dBiKc0I","created_at":1758091973,"is_remember":false,"refresh_expires_at":1758696773,"expires_at":1758178373,"username":"dat.haquoc+09","user_id":1968204319014523000}}',
    isLogin: 'true',
    isRegistering: '"not loaded"',
    loadingStatusEmail: '"not loaded"',
    redirectUrl: 'null',
    activeAccount: '"1968204319014523000"',
    _persist: '{"version":-1,"rehydrated":true}',
  },
};

/**
 * Global configuration constants
 */
export const GLOBAL_CONFIG = {
  LOCAL_BASE_URL: process.env.BASE_URL || '',
  SKIP_LOGIN: process.env.SKIP_LOGIN === 'true',
} as const;

/**
 * Website-specific configurations
 */
export const WEBSITE_CONFIGS = {
  MEZON: {
    baseURL: process.env.BASE_URL,
    name: 'Mezon Development',
  },
} as const;

/**
 * Creates environment-specific configuration based on NODE_ENV
 */
function getEnvironmentConfig(): EnvironmentConfig {
  const env = process.env.NODE_ENV || 'development';
  const website = process.env.WEBSITE || 'MEZON';
  const websiteConfig =
    WEBSITE_CONFIGS[website as keyof typeof WEBSITE_CONFIGS] || WEBSITE_CONFIGS.MEZON;

  const baseConfig: EnvironmentConfig = {
    baseURL: (process.env.BASE_URL || websiteConfig.baseURL) as string,
    timeout: {
      default: parseInt(process.env.DEFAULT_TIMEOUT || '30000'),
      navigation: parseInt(process.env.NAVIGATION_TIMEOUT || '30000'),
      action: parseInt(process.env.ACTION_TIMEOUT || '10000'),
    },
    browser: {
      headless: process.env.HEADLESS !== 'false',
      slowMo: parseInt(process.env.SLOW_MO || '0'),
    },
    screenshots: {
      mode: (process.env.SCREENSHOT_MODE as any) || 'only-on-failure',
      path: process.env.SCREENSHOT_PATH || 'test-results/screenshots',
    },
    video: {
      mode: (process.env.VIDEO_MODE as any) || 'retain-on-failure',
      path: process.env.VIDEO_PATH || 'test-results/videos',
    },
    trace: {
      mode: (process.env.TRACE_MODE as any) || 'on-first-retry',
      path: process.env.TRACE_PATH || 'test-results/traces',
    },
    retries: parseInt(process.env.RETRIES || (process.env.CI ? '2' : '0')),
    workers: parseInt(process.env.WORKERS || (process.env.CI ? '1' : '4')),
  };

  // Environment-specific overrides
  switch (env) {
    case 'production':
      return {
        ...baseConfig,
        baseURL: (process.env.BASE_URL || websiteConfig.baseURL) as string,
        browser: {
          ...baseConfig.browser,
          headless: true,
          slowMo: 0,
        },
        retries: 3,
        workers: 2,
      };

    case 'staging':
      return {
        ...baseConfig,
        baseURL: (process.env.BASE_URL || websiteConfig.baseURL) as string,
        retries: 2,
        workers: 2,
      };

    case 'test':
    case 'ci':
      return {
        ...baseConfig,
        browser: {
          ...baseConfig.browser,
          headless: true,
          slowMo: 0,
        },
        screenshots: {
          ...baseConfig.screenshots,
          mode: 'on',
        },
        video: {
          ...baseConfig.video,
          mode: 'on',
        },
        retries: 2,
        workers: 1,
      };

    case 'development':
    default:
      return {
        ...baseConfig,
        browser: {
          ...baseConfig.browser,
          headless: false,
          slowMo: 100,
        },
        retries: 0,
        workers: 4,
      };
  }
}

/**
 * Main environment configuration instance
 */
export const ENV_CONFIG = getEnvironmentConfig();

/**
 * Utility function to check if running in CI environment
 */
export const isCI = () => !!process.env.CI;

/**
 * Browser configuration factory function
 */
export const getBrowserConfig = () => ({
  headless: ENV_CONFIG.browser.headless,
  slowMo: ENV_CONFIG.browser.slowMo,
  args: isCI()
    ? ['--disable-dev-shm-usage', '--no-sandbox']
    : [
        '--disable-clipboard-read-write',
        '--disable-permissions-api',
        '--disable-features=ClipboardReadWrite',
        '--disable-clipboard-sanitization',
      ],
});
