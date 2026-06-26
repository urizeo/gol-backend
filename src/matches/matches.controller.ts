import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  Optional,
  DefaultValuePipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { MatchesService } from './matches.service';

@ApiTags('matches')
@Controller('api/matches')
export class MatchesController {
  constructor(private matchesService: MatchesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all matches' })
  @ApiQuery({ name: 'status', required: false, enum: ['pre', 'in', 'post'] })
  @ApiQuery({
    name: 'date',
    required: false,
    type: String,
    description: 'YYYY-MM-DD',
  })
  async findAll(
    @Query('status') status?: string,
    @Query('date') date?: string,
  ) {
    return this.matchesService.findAll(status, date);
  }

  @Get('live')
  @ApiOperation({ summary: 'Get live matches' })
  async findLive() {
    return this.matchesService.findLive();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get match by ID' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.matchesService.findOne(id);
  }

  @Get(':id/plays')
  @ApiOperation({ summary: 'Get plays for a match' })
  @ApiQuery({ name: 'significant', required: false, type: Boolean })
  async findPlays(
    @Param('id', ParseIntPipe) id: number,
    @Query('significant', new DefaultValuePipe('false')) significant: string,
  ) {
    return this.matchesService.findPlays(id, significant === 'true');
  }
}
