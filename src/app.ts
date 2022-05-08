import compression from 'compression';
import cookieParser from 'cookie-parser';
import cors from 'cors'; //cors 정책 세팅 모듈
import express from 'express';
import helmet from 'helmet'; //서버 보안용 미들웨어
import hpp from 'hpp'; //매개변수 공격 보안용 미들웨어
import morgan from 'morgan'; //http 로깅 미들웨어
import { NODE_ENV, PORT, LOG_FORMAT, ORIGIN, CREDENTIALS, SOCKET_PORT } from '@config';
import { Routes } from '@interfaces/routes.interface';
import errorMiddleware from '@middlewares/error.middleware';
import { logger, stream } from '@utils/logger';
import { Server } from 'socket.io';

class App {
  public app: express.Application;
  public env: string;
  public port: string | number;

  public io: Server;
  public socketPort: string | number;

  constructor(routes: Routes[]) {
    this.app = express();
    this.env = NODE_ENV || 'development';
    this.port = PORT || 3000;
    this.socketPort = SOCKET_PORT || 3001;

    this.initializeMiddlewares();
    this.initializeRoutes(routes);
    this.initializeErrorHandling();
    this.initializeSocket(this.socketPort);
  }

  public listen() {
    this.io.on('connection', () => {});

    this.app.listen(this.port, () => {
      logger.info(`=================================`);
      logger.info(`======= ENV: ${this.env} =======`);
      logger.info(`🚀 App listening on the port ${this.port}`);
      logger.info(`=================================`);
    });
  }

  public getServer() {
    return this.app;
  }

  private initializeMiddlewares() {
    this.app.use(morgan(LOG_FORMAT, { stream }));
    this.app.use(cors({ origin: ORIGIN, credentials: CREDENTIALS }));
    this.app.use(hpp());
    this.app.use(helmet());
    this.app.use(compression());
    this.app.use(express.json());
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(cookieParser());
  }

  private initializeRoutes(routes: Routes[]) {
    routes.forEach(route => {
      this.app.use('/', route.router);
    });
  }

  private initializeErrorHandling() {
    this.app.use(errorMiddleware);
  }

  private initializeSocket(socketPort) {
    interface ServerToClientEvents {
      noArg: () => void;
      basicEmit: (a: number, b: string, c: Buffer) => void;
      withAck: (d: string, callback: (e: number) => void) => void;
    }

    interface ClientToServerEvents {
      hello: () => void;
    }

    interface InterServerEvents {
      ping: () => void;
    }

    interface SocketData {
      name: string;
      age: number;
    }

    console.log('app.ts:initializeSocket:71 -> open', socketPort);
    this.io = new Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(socketPort);
  }
}

export default App;
