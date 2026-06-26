import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TeamsService } from './teams.service';

@ApiTags('teams')
@Controller('api/teams')
export class TeamsController {
  constructor(private teamsService: TeamsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all teams' })
  async findAll() {
    return this.teamsService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get team by ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.teamsService.findOne(id);
  }

  @Get(':id/players')
  @ApiOperation({ summary: 'Get team roster' })
  async findPlayers(@Param('id', ParseIntPipe) id: number) {
    return this.teamsService.findPlayers(id);
  }
}
