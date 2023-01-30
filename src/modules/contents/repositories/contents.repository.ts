import { PlatformType } from 'src/common/types/contents';
import { CustomRepository } from 'src/modules/db/typeorm-ex.decorator';
import { FindOptionsWhere, InsertResult, Like, Repository } from 'typeorm';
import { FindContentsOption } from '../dto/db';
import { SortOptions, SortOptionType } from '../dto/request';
import { Content } from '../entities/Content';

interface SearchContentsOption {
  genres?: string;
  tags?: string;
  platform?: PlatformType;
  keyword?: string;
  sortBy?: SortOptionType;
}
@CustomRepository(Content)
export class ContentRepository extends Repository<Content> {
  async createContent(content: Content): Promise<InsertResult> {
    return this.createQueryBuilder()
      .insert()
      .into(Content)
      .values(content)
      .orUpdate(
        ['uuid'],
        [
          'title',
          'summary',
          'description',
          'ageLimit',
          'isNew',
          'isPaused',
          'isUpdated',
          'isAdult',
          'urlOfPc',
          'urlOfMobile',
          'thumbnailPath',
        ],
      )
      .execute();
  }

  async findContentByUUID(uuid: string): Promise<Content> {
    return this.findOneBy({ uuid });
  }

  async findContentByTitle(title: string): Promise<Content> {
    return this.findOneBy({ title });
  }

  async findContentsWithCount(option: FindContentsOption) {
    const whereOption: FindOptionsWhere<Content> = {};
    if (option.type) whereOption.type = option.type;
    if (option.platform) whereOption.Platform = { name: option.platform };
    if (option.updateDay)
      whereOption.ContentUpdateDays = { UpdateDay: { name: option.updateDay } };

    return this.findAndCount({
      select: {
        idx: true,
        title: true,
        summary: true,
        thumbnailPath: true,
        urlOfMobile: true,
        ageLimit: true,
        isUpdated: true,
        isNew: true,
        isAdult: true,
      },
      relations: [
        'Platform',
        'ContentUpdateDays',
        'ContentUpdateDays.UpdateDay',
      ],
      where: whereOption,
      take: option.take,
      skip: option.take * (option.page - 1),
    });
  }

  async findContentDetailById(idx: number): Promise<Content> {
    return this.findOne({
      select: {
        idx: true,
        title: true,
        summary: true,
        description: true,
        thumbnailPath: true,
        urlOfMobile: true,
        ageLimit: true,
        isUpdated: true,
        isNew: true,
        isAdult: true,
        ContentUpdateDays: true,
        ContentAuthors: true,
        ContentGenres: true,
        Episodes: {
          order: true,
          title: true,
          pageUrl: true,
          thumbnailUrl: true,
          isFree: true,
          createdAt: true,
        },
      },
      relations: [
        'ContentUpdateDays',
        'ContentUpdateDays.UpdateDay',
        'ContentAuthors',
        'ContentAuthors.Author',
        'ContentGenres',
        'ContentGenres.Genre',
        'Episodes',
      ],
      where: { idx },
    });
  }

  async findContentDetailByTitle(title: string): Promise<Content> {
    return this.findOne({
      relations: [
        'Platform',
        'ContentUpdateDays',
        'ContentAuthors',
        'ContentGenres',
        'Episodes',
      ],
      where: { title },
    });
  }

  async findContentDetailByUUID(uuid: string): Promise<Content> {
    return this.findOne({
      select: {
        idx: true,
        title: true,
        summary: true,
        description: true,
        thumbnailPath: true,
        urlOfMobile: true,
        ageLimit: true,
        isUpdated: true,
        isNew: true,
        isAdult: true,
        ContentUpdateDays: true,
        ContentAuthors: true,
        ContentGenres: true,
        Episodes: {
          order: true,
          title: true,
          pageUrl: true,
          thumbnailUrl: true,
          isFree: true,
          createdAt: true,
        },
      },
      relations: [
        'ContentUpdateDays',
        'ContentUpdateDays.UpdateDay',
        'ContentAuthors',
        'ContentAuthors.Author',
        'ContentGenres',
        'ContentGenres.Genre',
        'Episodes',
      ],
      where: { uuid },
    });
  }

  async findContentIds() {
    return this.find({
      select: {
        idx: true,
      },
    });
  }

  async searchContentsBy(option: SearchContentsOption) {
    const qb = this.createQueryBuilder('content')
      .leftJoinAndSelect('content.Platform', 'platform')
      .leftJoinAndSelect('content.ContentUpdateDays', 'contentUpdateDays')
      .leftJoinAndSelect('contentUpdateDays.UpdateDay', 'updateDay');

    if (option.keyword) {
      qb.andWhere(`content.title like '%' :title '%'`, {
        title: option.keyword,
      });
    } else {
      if (option.genres) {
        const genres = option.genres.split(',');
        console.log(genres);
        qb.leftJoin('content.ContentGenres', 'contentGenres').leftJoin(
          'contentGenres.Genre',
          'genre',
        );
        qb.andWhere('genre.name IN (:genreName)', { genreName: genres });
      }
      if (option.tags) {
        const tags = option.tags.split(',');
        qb.leftJoin('content.ContentTags', 'contentTags').leftJoin(
          'contentTags.Tag',
          'tag',
        );
        qb.andWhere('tag.name IN (:tagName)', { tagName: tags });
      }
    }

    if (option.platform)
      qb.andWhere('platform.name = :platformName', {
        platformName: option.platform,
      });

    if (option.sortBy) {
      if (option.sortBy === SortOptions.title) {
        console.log('title 기준 오름차순 정렬');
        qb.orderBy('content.title');
      }
    }
    return qb.getManyAndCount();
  }
}
