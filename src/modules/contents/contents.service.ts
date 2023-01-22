import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Webtoon } from 'src/common/types/contents';
import { Repository } from 'typeorm';
import { Platform } from './entities/Platform';
import { UpdateDay } from './entities/UpdateDay';

@Injectable()
export class ContentsService {
  constructor(
    @InjectRepository(Platform)
    private readonly platformRepo: Repository<Platform>,
    @InjectRepository(UpdateDay)
    private readonly updateDayRepo: Repository<UpdateDay>,
  ) {}

  getGenres(webtoons: Array<Webtoon>): Array<{
    main: string;
    sub: Set<string>;
  }> {
    const genres = new Array<{
      main: string;
      sub: Set<string>;
    }>();

    for (const webtoon of webtoons) {
      // webtoon.genres
      const [mainGenreName, ...otherGenreNames] = webtoon.genres;

      let isMainGenreExist = false;
      for (const genre of genres) {
        if (genre.main === mainGenreName) {
          isMainGenreExist = true;
          break;
        }
      }

      if (mainGenreName !== '' && !isMainGenreExist) {
        const genre = { main: mainGenreName, sub: new Set<string>() };
        genres.push(genre);
      }

      for (const otherGenreName of otherGenreNames) {
        const genreItem = genres.find((genre) => genre.main === mainGenreName);

        if (genreItem && !genreItem.sub.has(otherGenreName)) {
          genreItem.sub.add(otherGenreName);
        }
      }
    }
    return genres;
  }

  getAuthors(webtoons: Array<Webtoon>): Set<string> {
    const authors = new Set<string>();
    for (const webtoon of webtoons) {
      for (const author of webtoon.authors) {
        if (author !== '' && !authors.has(author)) authors.add(author);
      }
    }
    return authors;
  }

  async initContentsTbl() {
    try {
      // platform 정보 테이블에 저장
      const platforms: Array<'kakao' | 'naver' | 'kakaoPage'> = [
        'kakao',
        'naver',
        'kakaoPage',
      ];
      for (const platformName of platforms) {
        const platformSelected = await this.platformRepo.findBy({
          name: platformName,
        });
        console.log(platformSelected);
        console.log('이미 존재하는 플랫폼 정보');
        if (platformSelected.length > 0) continue;
        const platformSaved = await this.platformRepo.save(
          this.toPlatformEntity(platformName),
        );
        console.log(platformSaved);
      }
      // updateDay 정보 테이블에 저장
      const updateDays: Array<
        | 'mon'
        | 'tue'
        | 'wed'
        | 'thu'
        | 'fri'
        | 'sat'
        | 'sun'
        | 'daily'
        | 'finished'
      > = [
        'mon',
        'tue',
        'wed',
        'thu',
        'fri',
        'sat',
        'sun',
        'daily',
        'finished',
      ];
      for (const updateDay of updateDays) {
        const updateDaySelected = await this.updateDayRepo.findBy({
          name: updateDay,
        });
        console.log('이미 존재하는 updateDay 데이터');
        if (updateDaySelected.length > 0) continue;
        const updateDaySaved = await this.updateDayRepo.save(
          this.toUpdateDayEntity(updateDay),
        );
        console.log(updateDaySaved);
      }
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  toPlatformEntity(name: 'kakao' | 'naver' | 'kakaoPage') {
    const platform = new Platform();
    platform.name = name;
    return platform;
  }

  toUpdateDayEntity(
    name:
      | 'mon'
      | 'tue'
      | 'wed'
      | 'thu'
      | 'fri'
      | 'sat'
      | 'sun'
      | 'daily'
      | 'finished',
  ) {
    const updateDay = new UpdateDay();
    updateDay.name = name;
    return updateDay;
  }
}
