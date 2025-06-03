import { isPlatformBrowser, JsonPipe } from '@angular/common';
import { afterRenderEffect, Component, Inject, Input, OnInit, PLATFORM_ID } from '@angular/core';
import { Attribute } from '../../core/models/attribute.model';
import { BaseResourceService } from '../../core/services/base/base-resource.service';

@Component({
    selector: 'app-table',
    standalone: true,
    templateUrl: './table.component.html',
})
export class TableComponent implements OnInit {
    @Input() model!: BaseResourceService;
    @Input() endpoint?: string;


    get rows(): any[] {
        return this.model.items;
    }

    get columns(): Attribute[] {
        return this.model.getListableAttributes();
    }

    ngOnInit(): void {
        // const isBrowser = isPlatformBrowser(this.platformId);
        // const mode = isBrowser ? 'client' : 'server';

        // const modelInstance = this.endpoint
        //     ? this.model.from(this.endpoint)
        //     : this.model;

        // this.columns = modelInstance.getListableAttributes();
        // modelInstance.getAll().subscribe(); // dispara la carga de datos

        console.log(this.model.items);

    }
}
