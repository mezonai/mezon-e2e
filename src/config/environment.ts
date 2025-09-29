import { EnvironmentConfig } from '@/config/types';
import { Page } from '@playwright/test';
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
      '{"1964889885160509400":{"created":false,"api_url":"https://dev-mezon.nccsoft.vn:7305","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiI0ODJjMDM2OS0zMmNlLTQ1NzItOGRiOS0zZDdjOGUzZTJkZjYiLCJ1aWQiOjE5NjQ4ODk4ODUxNjA1MDk0NDAsInVzbiI6ImRhdC5oYXF1b2MrMDEiLCJleHAiOjE3NTkxMTY1NTN9.I_3D4XxnpitLFt8H5P-cGNyRSquYcrWQ35Ne6JJ7WHM","refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiI0ODJjMDM2OS0zMmNlLTQ1NzItOGRiOS0zZDdjOGUzZTJkZjYiLCJ1aWQiOjE5NjQ4ODk4ODUxNjA1MDk0NDAsInVzbiI6ImRhdC5oYXF1b2MrMDEiLCJleHAiOjE3NTk3MjA3NTN9.cvgIpV4nPMkT4EfxUfFUl-9i5PSSXK1S3XGSty7E3vE","created_at":1759115953,"is_remember":false,"refresh_expires_at":1759720753,"expires_at":1759116553,"username":"dat.haquoc+01","user_id":1964889885160509400}}',
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
      '{"1964937944108109800":{"created":false,"api_url":"https://dev-mezon.nccsoft.vn:7305","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJkNTYyYTRlMy1hMDUxLTQ3ZTQtYTBmZS1kMmIxZDk3NDFhYTAiLCJ1aWQiOjE5NjQ5Mzc5NDQxMDgxMDk4MjQsInVzbiI6ImRhdC5oYXF1b2MrMDMiLCJleHAiOjE3NTkyMDI3Nzh9.0RG_LwgTJW9XU61aCp2ysz9kNib1WWDZKVhjaj-GsIY","refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJkNTYyYTRlMy1hMDUxLTQ3ZTQtYTBmZS1kMmIxZDk3NDFhYTAiLCJ1aWQiOjE5NjQ5Mzc5NDQxMDgxMDk4MjQsInVzbiI6ImRhdC5oYXF1b2MrMDMiLCJleHAiOjE3NTk3MjExNzh9.mKD7qm3nI2-WBekXM15vNl5zpAheq7UsAkLFiAbZ2NM","created_at":1759116378,"is_remember":false,"refresh_expires_at":1759721178,"expires_at":1759202778,"username":"dat.haquoc+03","user_id":1964937944108109800}}',
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
      '{"1964952630786527200":{"created":false,"api_url":"https://dev-mezon.nccsoft.vn:7305","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiI3ZTI2OWJlNi0yMWRjLTRkOWEtOGYyNC1iY2Y3YWIxN2RjMTQiLCJ1aWQiOjE5NjQ5NTI2MzA3ODY1MjcyMzIsInVzbiI6ImRhdC5oYXF1b2MrMDQiLCJleHAiOjE3NTkyMDI4ODl9.719zxXZVat0kTuoOQn20pD-_Zaq4DXE9FrNYIDEdA2M","refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiI3ZTI2OWJlNi0yMWRjLTRkOWEtOGYyNC1iY2Y3YWIxN2RjMTQiLCJ1aWQiOjE5NjQ5NTI2MzA3ODY1MjcyMzIsInVzbiI6ImRhdC5oYXF1b2MrMDQiLCJleHAiOjE3NTk3MjEyODl9.p6lIgh-oi0q6IEmAA1PAOJuRFYqWL2XYDfI42GUx3N0","created_at":1759116489,"is_remember":false,"refresh_expires_at":1759721289,"expires_at":1759202889,"username":"dat.haquoc+04","user_id":1964952630786527200}}',
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
      '{"1964953116990247000":{"created":false,"api_url":"https://dev-mezon.nccsoft.vn:7305","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJkZTRmZmQyOS1mNmMxLTQ5MjUtYjQ0NS02Y2I4OTYxYzA4NzciLCJ1aWQiOjE5NjQ5NTMxMTY5OTAyNDY5MTIsInVzbiI6ImRhdC5oYXF1b2MrMDUiLCJleHAiOjE3NTkyMDMwNzN9.cUWMa3lr_pf1RK-UrB-rqifw9jcrcx0P2jGPbraaryY","refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJkZTRmZmQyOS1mNmMxLTQ5MjUtYjQ0NS02Y2I4OTYxYzA4NzciLCJ1aWQiOjE5NjQ5NTMxMTY5OTAyNDY5MTIsInVzbiI6ImRhdC5oYXF1b2MrMDUiLCJleHAiOjE3NTk3MjE0NzN9.5rwyNHgBMJRf1RWhTURQWTFtLTT3o26S2Z-uci9hm5s","created_at":1759116672,"is_remember":false,"refresh_expires_at":1759721473,"expires_at":1759203073,"username":"dat.haquoc+05","user_id":1964953116990247000}}',
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
      '{"1964953606733959200":{"created":false,"api_url":"https://dev-mezon.nccsoft.vn:7305","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJkMzIyNWM4Yy05NGJjLTQ3MzctODlhNC1hOTU3OWQ3NzU1YTgiLCJ1aWQiOjE5NjQ5NTM2MDY3MzM5NTkxNjgsInVzbiI6ImRhdC5oYXF1b2MrMDYiLCJleHAiOjE3NTkyMDM0NTJ9.5lLtNW4tnjaiynQGhSYUeIPeL_28Iie0BMDSh1GXzRA","refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJkMzIyNWM4Yy05NGJjLTQ3MzctODlhNC1hOTU3OWQ3NzU1YTgiLCJ1aWQiOjE5NjQ5NTM2MDY3MzM5NTkxNjgsInVzbiI6ImRhdC5oYXF1b2MrMDYiLCJleHAiOjE3NTk3MjE4NTJ9.wHjS5X_gy6djB2HSLIQcqnsFxS-gQ77K9KpsXt56FSk","created_at":1759117051,"is_remember":false,"refresh_expires_at":1759721852,"expires_at":1759203452,"username":"dat.haquoc+06","user_id":1964953606733959200}}',
    isLogin: 'true',
    isRegistering: '"not loaded"',
    loadingStatusEmail: '"not loaded"',
    redirectUrl: 'null',
    activeAccount: '"1964953606733959200"',
    _persist: '{"version":-1,"rehydrated":true}',
  },
  'account6-1': {
    loadingStatus: '"loaded"',
    session:
      '{"1971053457024487400":{"created":false,"api_url":"https://dev-mezon.nccsoft.vn:7305","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiI5MzE5MDVhZS1hZjJjLTQ2MTMtOGY4OS1lNjY2YmE4OTE3OWQiLCJ1aWQiOjE5NzEwNTM0NTcwMjQ0ODc0MjQsInVzbiI6ImRhdC5oYXF1b2MrMDYtMSIsImV4cCI6MTc1OTIwMzUwN30.YJng-C2670OTu68kWB0FLSQ2tV9ehxXMZfAulnpyImA","refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiI5MzE5MDVhZS1hZjJjLTQ2MTMtOGY4OS1lNjY2YmE4OTE3OWQiLCJ1aWQiOjE5NzEwNTM0NTcwMjQ0ODc0MjQsInVzbiI6ImRhdC5oYXF1b2MrMDYtMSIsImV4cCI6MTc1OTcyMTkwN30.inundJnd59m0Pv07ji8IJ3BdEZk91Mo3htsbkYANAHA","created_at":1759117107,"is_remember":false,"refresh_expires_at":1759721907,"expires_at":1759203507,"username":"dat.haquoc+06-1","user_id":1971053457024487400}}',
    isLogin: 'true',
    isRegistering: '"not loaded"',
    loadingStatusEmail: '"not loaded"',
    redirectUrl: 'null',
    activeAccount: '"1971053457024487400"',
    _persist: '{"version":-1,"rehydrated":true}',
  },
  account7: {
    loadingStatus: '"loaded"',
    session:
      '{"1967789474532298800":{"created":false,"api_url":"https://dev-mezon.nccsoft.vn:7305","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiI3ZWRiODI4YS1jYTVkLTQxMGMtODViMy03NGYwNGY0NDI4YTciLCJ1aWQiOjE5Njc3ODk0NzQ1MzIyOTg3NTIsInVzbiI6ImRhdC5oYXF1b2MrMDciLCJleHAiOjE3NTkyMDM1NDh9.an4ZIgfZMb0nkbJ9l1KteImv-vC_Sjh6fwBsOp4fgHo","refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiI3ZWRiODI4YS1jYTVkLTQxMGMtODViMy03NGYwNGY0NDI4YTciLCJ1aWQiOjE5Njc3ODk0NzQ1MzIyOTg3NTIsInVzbiI6ImRhdC5oYXF1b2MrMDciLCJleHAiOjE3NTk3MjE5NDh9.Rd8KE7aevI_TeOih5CPzV7gVDHwap10K9V7XxTEHZ40","created_at":1759117147,"is_remember":false,"refresh_expires_at":1759721948,"expires_at":1759203548,"username":"dat.haquoc+07","user_id":1967789474532298800}}',
    isLogin: 'true',
    isRegistering: '"not loaded"',
    loadingStatusEmail: '"not loaded"',
    redirectUrl: 'null',
    activeAccount: '"1967789474532298800"',
    _persist: '{"version":-1,"rehydrated":true}',
  },
  account8: {
    loadingStatus: '"loaded"',
    session:
      '{"1968198973806088200":{"created":false,"api_url":"https://dev-mezon.nccsoft.vn:7305","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiI5OWRjMjY3Yy0xZjI0LTQxYzEtYmMzZi05Y2Y1YzBjNTA1NGMiLCJ1aWQiOjE5NjgxOTg5NzM4MDYwODgxOTIsInVzbiI6ImRhdC5oYXF1b2MrMDgiLCJleHAiOjE3NTkyMDM2OTF9.w1BLiTfQeW6SJD87Ceto6U2MEMEqvWmPEw77oJM-RRU","refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiI5OWRjMjY3Yy0xZjI0LTQxYzEtYmMzZi05Y2Y1YzBjNTA1NGMiLCJ1aWQiOjE5NjgxOTg5NzM4MDYwODgxOTIsInVzbiI6ImRhdC5oYXF1b2MrMDgiLCJleHAiOjE3NTk3MjIwOTF9.qa8ncYP6iVo-eMzTwXXyHuvBy4fdK9J6R86qIAU6bdY","created_at":1759117291,"is_remember":false,"refresh_expires_at":1759722091,"expires_at":1759203691,"username":"dat.haquoc+08","user_id":1968198973806088200}}',
    isLogin: 'true',
    isRegistering: '"not loaded"',
    loadingStatusEmail: '"not loaded"',
    redirectUrl: 'null',
    activeAccount: '"1968198973806088200"',
    _persist: '{"version":-1,"rehydrated":true}',
  },
  'account2-1': {
    loadingStatus: '"loaded"',
    session:
      '{"1967441732656173000":{"created":false,"api_url":"https://dev-mezon.nccsoft.vn:7305","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiI5YmVhNjI5Zi1lMjM4LTQ4ZDMtODA0Ni01MTU4ZWY5MjQ4ZWEiLCJ1aWQiOjE5Njc0NDE3MzI2NTYxNzMwNTYsInVzbiI6ImRhdC5oYXF1b2MrMDItMSIsImV4cCI6MTc1OTIwMjQzOH0.FuRUxushg_Ku_ORoasIC_Za5QOd280ZXN7m-Xl1vsU4","refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiI5YmVhNjI5Zi1lMjM4LTQ4ZDMtODA0Ni01MTU4ZWY5MjQ4ZWEiLCJ1aWQiOjE5Njc0NDE3MzI2NTYxNzMwNTYsInVzbiI6ImRhdC5oYXF1b2MrMDItMSIsImV4cCI6MTc1OTcyMDgzOH0.BS2JX8u2oAQTpITHlzUbVLe5BJcVy7U-RSQLC06lIJM","created_at":1759116038,"is_remember":false,"refresh_expires_at":1759720838,"expires_at":1759202438,"username":"dat.haquoc+02-1","user_id":1967441732656173000}}',
    isLogin: 'true',
    isRegistering: '"not loaded"',
    loadingStatusEmail: '"not loaded"',
    redirectUrl: 'null',
    activeAccount: '"1967441732656173000"',
    _persist: '{"version":-1,"rehydrated":true}',
  },
  'account2-2': {
    loadingStatus: '"loaded"',
    session:
      '{"1967442215051464700":{"created":false,"api_url":"https://dev-mezon.nccsoft.vn:7305","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJjYzJjYjdiMy05YmY0LTQyNGMtYTgxNC1hN2RiYzY3MTgzZjUiLCJ1aWQiOjE5Njc0NDIyMTUwNTE0NjQ3MDQsInVzbiI6ImRhdC5oYXF1b2MrMDItMiIsImV4cCI6MTc1OTIwMjU0Mn0.ELOmBAQEHORMHpTvqz8KjiYMuIpq_DiBhEaKoM9oWzQ","refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJjYzJjYjdiMy05YmY0LTQyNGMtYTgxNC1hN2RiYzY3MTgzZjUiLCJ1aWQiOjE5Njc0NDIyMTUwNTE0NjQ3MDQsInVzbiI6ImRhdC5oYXF1b2MrMDItMiIsImV4cCI6MTc1OTcyMDk0Mn0.Zeg67LTeG_YYy69lwhngZQrqmz3ayXWJefHyUeqvIsU","created_at":1759116142,"is_remember":false,"refresh_expires_at":1759720942,"expires_at":1759202542,"username":"dat.haquoc+02-2","user_id":1967442215051464700}}',
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
      '{"1967442542983123000":{"created":false,"api_url":"https://dev-mezon.nccsoft.vn:7305","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiIyNjkwODIyMC0zMGQzLTRjNDgtOTBhOS05NTcwNTViZTQ0ZGQiLCJ1aWQiOjE5Njc0NDI1NDI5ODMxMjI5NDQsInVzbiI6ImRhdC5oYXF1b2MrMDItMyIsImV4cCI6MTc1OTIwMjYyNn0.1562Ja_KrjqV5BHUcafBSfPWp-Drxl3GazVoduxcNh0","refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiIyNjkwODIyMC0zMGQzLTRjNDgtOTBhOS05NTcwNTViZTQ0ZGQiLCJ1aWQiOjE5Njc0NDI1NDI5ODMxMjI5NDQsInVzbiI6ImRhdC5oYXF1b2MrMDItMyIsImV4cCI6MTc1OTcyMTAyNn0.Cs5KkM8ONKpyxWGAv7hHMYac0fGhSegVjSvgcjwnToY","created_at":1759116225,"is_remember":false,"refresh_expires_at":1759721026,"expires_at":1759202626,"username":"dat.haquoc+02-3","user_id":1967442542983123000}}',
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
      '{"1967442871149662200":{"created":false,"api_url":"https://dev-mezon.nccsoft.vn:7305","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiI3NTFhNTIyNy02N2VmLTQyOGMtODQ5OS0wZjg5NmYwMGIzYTAiLCJ1aWQiOjE5Njc0NDI4NzExNDk2NjIyMDgsInVzbiI6ImRhdC5oYXF1b2MrMDItNCIsImV4cCI6MTc1OTIwMjY5MH0.1P4IC2MyU_f90Axd2RK6fqoE2HNIa7KH6a6VwKMyW40","refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiI3NTFhNTIyNy02N2VmLTQyOGMtODQ5OS0wZjg5NmYwMGIzYTAiLCJ1aWQiOjE5Njc0NDI4NzExNDk2NjIyMDgsInVzbiI6ImRhdC5oYXF1b2MrMDItNCIsImV4cCI6MTc1OTcyMTA5MH0.dSFECtlRLFkKY-M7f_rbiiaaWkmBF0k9SCF8LgH0HdE","created_at":1759116290,"is_remember":false,"refresh_expires_at":1759721090,"expires_at":1759202690,"username":"dat.haquoc+02-4","user_id":1967442871149662200}}',
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
      '{"1967443118043172900":{"created":false,"api_url":"https://dev-mezon.nccsoft.vn:7305","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJmNWE5OTRjYS0zY2MzLTRiYTItYWJhOS05ZWQ1ZjQ0MmNlNzciLCJ1aWQiOjE5Njc0NDMxMTgwNDMxNzI4NjQsInVzbiI6ImRhdC5oYXF1b2MrMDItNSIsImV4cCI6MTc1OTIwNTI2OX0.VnQTWTTl6eHYWN_RlI7C3JZHMGFgDMWev-hAfYYUXZM","refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJmNWE5OTRjYS0zY2MzLTRiYTItYWJhOS05ZWQ1ZjQ0MmNlNzciLCJ1aWQiOjE5Njc0NDMxMTgwNDMxNzI4NjQsInVzbiI6ImRhdC5oYXF1b2MrMDItNSIsImV4cCI6MTc1OTcyMzY2OX0.OgERdmO7hVpVePT8Sb5EHdBE2gDeqGb-g_sb-hQeleI","created_at":1759118868,"is_remember":false,"refresh_expires_at":1759723669,"expires_at":1759205269,"username":"dat.haquoc+02-5","user_id":1967443118043172900}}',
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
      '{"1968204319014523000":{"created":false,"api_url":"https://dev-mezon.nccsoft.vn:7305","token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJiNjA4YjdmNy1hN2I1LTQzNWMtOTI0MS1lZDRkMTI5M2RhNWEiLCJ1aWQiOjE5NjgyMDQzMTkwMTQ1MjI4ODAsInVzbiI6ImRhdC5oYXF1b2MrMDkiLCJleHAiOjE3NTkyMDM3MzJ9.YyvXF_C-CYy85oUIrx402qGq45T9P_RjSfu5z-KDsGk","refresh_token":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0aWQiOiJiNjA4YjdmNy1hN2I1LTQzNWMtOTI0MS1lZDRkMTI5M2RhNWEiLCJ1aWQiOjE5NjgyMDQzMTkwMTQ1MjI4ODAsInVzbiI6ImRhdC5oYXF1b2MrMDkiLCJleHAiOjE3NTk3MjIxMzJ9.l5nUqxcE3_A0i0eZLZizVnhUmZcDfZkoubzwVRbx3yA","created_at":1759117332,"is_remember":false,"refresh_expires_at":1759722132,"expires_at":1759203732,"username":"dat.haquoc+09","user_id":1968204319014523000}}',
    isLogin: 'true',
    isRegistering: '"not loaded"',
    loadingStatusEmail: '"not loaded"',
    redirectUrl: 'null',
    activeAccount: '"1968204319014523000"',
    _persist: '{"version":-1,"rehydrated":true}',
  },
};

// Backward compatibility - keeping original persistentConfig
const persistentConfig = persistentAuthConfigs.account1;

// Function to get auth config by account key
export const getAuthConfig = (accountKey: keyof typeof persistentAuthConfigs) => {
  return persistentAuthConfigs[accountKey] || persistentAuthConfigs.account1;
};

// Function to get auth config by suite name
export const getAuthConfigBySuite = (suiteName: string) => {
  const suiteToAccountMap: Record<string, keyof typeof persistentAuthConfigs> = {
    'Channel Management': 'account1',
    'Channel Message': 'account2',
    'Clan Management': 'account3',
    'Direct Message': 'account4',
    'Onboarding Guide': 'account5',
    'User Profile': 'account6',
    'User Profile - Module 1': 'account6-1',
    'Thread Management': 'account7',
    'Channel Message - Module 1': 'account2-1',
    'Channel Message - Module 2': 'account2-2',
    'Channel Message - Module 3': 'account2-3',
    'Channel Message - Module 4': 'account2-4',
    'Channel Message - Module 5': 'account2-5',
    'Standalone - Clan Management': 'account8',
    'Upload File': 'account9',
  };

  const accountKey = suiteToAccountMap[suiteName] || 'account1';
  return { config: getAuthConfig(accountKey), accountKey };
};

// Get available account keys
export const getAvailableAccounts = () => Object.keys(persistentAuthConfigs);

type AccountKey = keyof typeof persistentAuthConfigs;

export const updateSessionLocalStorage = async (page: Page, accountKey: AccountKey) => {
  await page.goto(WEBSITE_CONFIGS.MEZON.baseURL as string);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(2000);

  try {
    const authConfigResult = getAuthConfig(accountKey);
    const authConfig =
      authConfigResult && 'config' in authConfigResult ? authConfigResult.config : authConfigResult;

    if (!authConfig) {
      throw new Error(`No authentication config found for account: ${accountKey}`);
    }

    const mezonSession = {
      host: 'dev-mezon.nccsoft.vn',
      port: '7305',
      ssl: true,
    };

    await page.evaluate(
      (authData: any) => {
        localStorage.setItem('mezon_session', JSON.stringify(authData.mezonSession));

        localStorage.setItem('i18nextLng', 'en');

        localStorage.setItem(
          'persist:auth',
          JSON.stringify({
            loadingStatus: authData.persistAuth.loadingStatus,
            session: authData.persistAuth.session,
            isLogin: authData.persistAuth.isLogin,
            isRegistering: authData.persistAuth.isRegistering,
            loadingStatusEmail: authData.persistAuth.loadingStatusEmail,
            redirectUrl: authData.persistAuth.redirectUrl,
            activeAccount: authData.persistAuth.activeAccount,
            _persist: authData.persistAuth._persist,
          })
        );
      },
      {
        mezonSession,
        persistAuth: authConfig,
      }
    );
  } catch (error) {
    console.error(`Failed to update session for account ${accountKey}:`, error);
    throw error;
  }
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

// Function to get auth data for specific account
export const getLocalAuthData = (accountKey: keyof typeof persistentAuthConfigs) => {
  return {
    persist: {
      key: 'persist:auth',
      value: getAuthConfig(accountKey),
    },
    mezonSession: {
      key: 'mezon_session',
      value: JSON.stringify(getSessionConfig()),
    },
  };
};

export const getSessionConfig = () => {
  return {
    host: process.env.MEZON_SESSION_HOST || 'dev-mezon.nccsoft.vn',
    port: process.env.MEZON_SESSION_PORT || '7305',
    ssl: true,
  };
};
