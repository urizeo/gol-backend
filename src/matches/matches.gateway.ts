import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { Match } from '../entities/match.entity';
import { MatchPlay } from '../entities/match-play.entity';

interface ClientSubscription {
  matchId: number;
  mode: 'raw' | 'timeline';
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class MatchesGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(MatchesGateway.name);
  private readonly clientSubscriptions = new Map<
    string,
    ClientSubscription[]
  >();

  afterInit(_server: Server): void {
    this.logger.log('WebSocket gateway initialized');
  }

  handleConnection(client: Socket): void {
    this.logger.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket): void {
    this.logger.log(`Client disconnected: ${client.id}`);
    this.clientSubscriptions.delete(client.id);
  }

  @SubscribeMessage('subscribe:match')
  handleSubscribeMatch(
    client: Socket,
    payload: { matchId: number; mode?: 'raw' | 'timeline' },
  ): void {
    const matchId = typeof payload === 'number' ? payload : payload.matchId;
    const mode =
      typeof payload === 'object' && payload.mode ? payload.mode : 'timeline';

    client.join(`match:${matchId}`);

    const subs = this.clientSubscriptions.get(client.id) || [];
    const existing = subs.find((s) => s.matchId === matchId);
    if (existing) {
      existing.mode = mode;
    } else {
      subs.push({ matchId, mode });
    }
    this.clientSubscriptions.set(client.id, subs);

    this.logger.debug(
      `Client ${client.id} subscribed to match ${matchId} (mode: ${mode})`,
    );
  }

  @SubscribeMessage('unsubscribe:match')
  handleUnsubscribeMatch(
    client: Socket,
    payload: { matchId: number } | number,
  ): void {
    const matchId = typeof payload === 'number' ? payload : payload.matchId;

    client.leave(`match:${matchId}`);

    const subs = this.clientSubscriptions.get(client.id) || [];
    const filtered = subs.filter((s) => s.matchId !== matchId);
    if (filtered.length > 0) {
      this.clientSubscriptions.set(client.id, filtered);
    } else {
      this.clientSubscriptions.delete(client.id);
    }

    this.logger.debug(`Client ${client.id} unsubscribed from match ${matchId}`);
  }

  getRawSubscribers(matchId: number): Set<string> {
    const clients = new Set<string>();
    for (const [clientId, subs] of this.clientSubscriptions) {
      if (subs.some((s) => s.matchId === matchId && s.mode === 'raw')) {
        clients.add(clientId);
      }
    }
    return clients;
  }

  getTimelineSubscribers(matchId: number): Set<string> {
    const clients = new Set<string>();
    for (const [clientId, subs] of this.clientSubscriptions) {
      if (subs.some((s) => s.matchId === matchId && s.mode === 'timeline')) {
        clients.add(clientId);
      }
    }
    return clients;
  }

  emitMatchUpdate(matchId: number, data: Match, clients?: Set<string>): void {
    const room = `match:${matchId}`;
    if (clients && clients.size > 0) {
      for (const clientId of clients) {
        this.server.to(clientId).emit('match:update', { matchId, ...data });
      }
    } else {
      this.server.to(room).emit('match:update', { matchId, ...data });
    }
    this.server.emit('matches:update', { matchId, ...data });
  }

  emitNewPlay(matchId: number, play: MatchPlay, clients?: Set<string>): void {
    const room = `match:${matchId}`;
    if (clients && clients.size > 0) {
      for (const clientId of clients) {
        this.server.to(clientId).emit('play:new', { matchId, play });
      }
    } else {
      this.server.to(room).emit('play:new', { matchId, play });
    }
    this.server.emit('matches:play', { matchId, play });
  }
}
