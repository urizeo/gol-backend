import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { PlayersService } from './players.service';

@ApiTags('players')
@Controller('api/players')
export class PlayersController {
  constructor(private playersService: PlayersService) {}

  @Get(':id')
  @ApiOperation({ summary: 'Get player by ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.playersService.findOne(id);
  }
}
