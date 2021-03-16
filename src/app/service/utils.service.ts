import {Injectable} from '@angular/core';
import {Artifact, Type} from './generic.service';
import {NzMessageService} from 'ng-zorro-antd/message';
import * as dayjs from 'dayjs';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {

  static readonly DATE_FORMAT = 'YYYY-MM-DD HH:mm:ss';

  static readonly DATE_8301_FORMAT = 'YYYY-MM-DDTHH:mm:ss';

  constructor(private message: NzMessageService) {
  }

  /**
   * 获取URL的查询参数值
   * @param url URL
   * @param key KEY
   * @private
   */
  getParamValue(url: string, key: string): string | null {
    const regex = new RegExp(key + '=([^&]*)', 'i');
    const matchResult = url.match(regex);
    if (!matchResult || matchResult.length < 1) {
      return null;
    }
    return url.match(regex)[1];
  }


  /**
   * 获取对象的类型
   * @param o 对象
   */
  getObjectType(o: any): Type {
    const type = Object.prototype.toString.call(o);
    switch (type) {
      case '[object Array]':
        return Type.ARRAY;
      case '[object Object]':
        return Type.OBJECT;
      case '[object Number]':
        return Type.NUMBER;
      case '[object Boolean]':
        return Type.BOOLEAN;
      case '[object String]':
        return Type.STRING;
      default:
        console.error(`Not Supported Type:${type}`);
    }
  }

  /**
   * 复制到粘贴板
   * @param info 信息
   */
  copyToClip(info: string): void {
    const aux = document.createElement('input');
    aux.setAttribute('value', info);
    document.body.appendChild(aux);
    aux.select();
    document.execCommand('copy');
    document.body.removeChild(aux);
    this.message.success('复制成功');
  }

  /**
   * 滚动
   * @param el 元素
   * @param top 上
   * @param left 左
   */
  scrollToWithSmooth(el: Element, top: number, left: number): void {
    el.scrollTo({top, left, behavior: 'smooth'});
  }

  /**
   * 滚动到末尾
   * @param el 元素
   */
  scrollToEndSmooth(el: Element): void {
    const scrollHeight = el.scrollHeight;
    this.scrollToWithSmooth(el, scrollHeight, 0);
  }

  isMatchDateString(value: string): boolean {
    return /([0-9]{3}[1-9]|[0-9]{2}[1-9][0-9]{1}|[0-9]{1}[1-9][0-9]{2}|[1-9][0-9]{3})-(((0[13578]|1[02])-(0[1-9]|[12][0-9]|3[01]))|((0[469]|11)-(0[1-9]|[12][0-9]|30))|(02-(0[1-9]|[1][0-9]|2[0-8])))\s([0-1][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])/.test(value);
  }

  isMatchDate_8301String(value: string): boolean {
    return /([0-9]{3}[1-9]|[0-9]{2}[1-9][0-9]{1}|[0-9]{1}[1-9][0-9]{2}|[1-9][0-9]{3})-(((0[13578]|1[02])-(0[1-9]|[12][0-9]|3[01]))|((0[469]|11)-(0[1-9]|[12][0-9]|30))|(02-(0[1-9]|[1][0-9]|2[0-8])))[\s,T]([0-1][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])/.test(value);
  }

  getNowDate2String(): string {
    return dayjs().format(UtilsService.DATE_FORMAT);
  }

  getNowDate2_8301String(): string {
    return dayjs().format(UtilsService.DATE_8301_FORMAT);
  }

  formatDate2DateString(date: Date): string {
    return dayjs(date).format(UtilsService.DATE_FORMAT);
  }

  formatDate2Date_8301String(date: Date): string {
    return dayjs(date).format(UtilsService.DATE_8301_FORMAT);
  }

  formatDateString2Date(value: string): Date {
    return dayjs(value, UtilsService.DATE_FORMAT).toDate();
  }

  formatDate_8301String2Date(value: string): Date {
    return dayjs(value, UtilsService.DATE_8301_FORMAT).toDate();
  }

  genericMavenDependencyXml(artifact: Artifact): string {
    return `<dependency>
  <groupId>${artifact.groupId}</groupId>
  <artifactId>${artifact.artifactId}</artifactId>
  <version>${artifact.version}</version>
</dependency>`;
  }
}
