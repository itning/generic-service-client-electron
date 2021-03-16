import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {AttributeValueType, Item, Type} from '../../../../service/generic.service';
import {UtilsService} from '../../../../service/utils.service';

@Component({
  selector: 'app-attribute-item',
  templateUrl: './attribute-item.component.html',
  styleUrls: ['./attribute-item.component.scss']
})
export class AttributeItemComponent implements OnInit {
  /**
   * 某一参数列表
   */
  @Input()
  data: Item;
  /**
   * 偏移量：用于页面区分子属性
   */
  @Input()
  offset: number;

  @Input()
  parentData: Item;
  /**
   * 删除事件
   */
  @Output()
  delete: EventEmitter<string> = new EventEmitter();
  /**
   * 新增事件
   */
  @Output()
  add: EventEmitter<AttributeValueType> = new EventEmitter();

  constructor(private utils: UtilsService) {
  }

  ngOnInit(): void {
  }

  /**
   * 删除属性
   * @param id 属性唯一ID
   */
  deleteAttribute(id: string): void {
    this.delete.emit(id);
  }

  /**
   * 添加属性
   * @param data 要添加所在的父属性
   */
  addAttribute(data: AttributeValueType): void {
    this.data.use = true;
    this.add.emit(data);
  }

  isPlain(type: Type): boolean {
    return type !== Type.OBJECT && type !== Type.ARRAY;
  }

  isDate(type: Type): boolean {
    return type !== Type.DATE && type !== Type.DATE_8601;
  }

  /**
   * 属性类型改变回调
   * @param data 某一个属性改变了
   */
  onTypeChange(data: Item): void {
    data.autoComplete = [];
    switch (data.type) {
      case Type.OBJECT:
      case Type.ARRAY:
        data.attributeValue = [];
        (data.attributeValue as Item[]).push(Item.generateString('', ''));
        break;
      case Type.BOOLEAN:
        data.autoComplete = ['true', 'false'];
        data.attributeValue = false;
        break;
      default:
        data.attributeValue = '';
    }
  }

  onDatePickerChange(result: Date, data: Item): void {
    if (result) {
      data.attributeValue = data.type === Type.DATE ?
        this.utils.formatDate2DateString(result) : this.utils.formatDate2Date_8301String(result);
      data.attributeValueDate = result;
    }
  }

  onUseChange($event: boolean, data: Item): void {
    if ($event && this.parentData) {
      this.parentData.use = true;
    }
    if (!this.isPlain(data.type)) {
      (data.attributeValue as Item[]).forEach(it => it.use = $event);
    }
  }
}
