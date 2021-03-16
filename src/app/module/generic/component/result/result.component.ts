import {ChangeDetectorRef, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild} from '@angular/core';
import {GenericService, TabInfo, WebSocketMessageType, WebSocketResultModel} from '../../../../service/generic.service';
import {NzNotificationService} from 'ng-zorro-antd/notification';
import {UtilsService} from '../../../../service/utils.service';

@Component({
  selector: 'app-result',
  templateUrl: './result.component.html',
  styleUrls: ['./result.component.scss']
})
export class ResultComponent implements OnInit {
  @Input()
  tabs: TabInfo[] = [];
  @Input()
  nowSelectedTab: number;
  @Output()
  lastJsonInfo: EventEmitter<string> = new EventEmitter<string>();
  @ViewChild('resultBox', {static: true})
  resultBoxElementRef: ElementRef;

  constructor(private genericService: GenericService,
              private notification: NzNotificationService,
              private util: UtilsService,
              private ref: ChangeDetectorRef) {
  }

  ngOnInit(): void {
    this.genericService.connectionResultWebSocketReply()
      .subscribe(model => {
        const tabInfo = this.tabs.find(it => it.id === model.echo);
        if (tabInfo) {
          this.renderResultView(model, tabInfo);
        } else {
          this.tabs.forEach(it => it.resultData.push(model.message));
        }
        this.ref.markForCheck();
        this.ref.detectChanges();
        setTimeout(() => this.util.scrollToEndSmooth(this.resultBoxElementRef.nativeElement as Element), 250);
      }, error => {
        this.notification.error('网络错误', `WebSocket连接出现错误！`);
        console.error(error);
      });
  }

  private renderResultView(resultModel: WebSocketResultModel, tab: TabInfo): void {
    switch (resultModel.type) {
      case WebSocketMessageType.PLAINTEXT:
        resultModel.message.split('\n').forEach(item => tab.resultData.push(item));
        break;
      case WebSocketMessageType.JSON:
        this.lastJsonInfo.emit(resultModel.message);
        tab.resultData.push(`<code>${resultModel.message}</code>`);
        break;
    }
  }
}
