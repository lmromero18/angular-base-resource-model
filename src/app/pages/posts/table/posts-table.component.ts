import {
  ChangeDetectionStrategy,
  Component,
  Injector,
  OnInit,
} from '@angular/core';
import { ControllerComponent } from '../../../core/base/controller';
import { PostsTableService } from './posts-table.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import { ReactiveFormsModule } from '@angular/forms';
import { TableComponent } from '../../../components/table/table.component';

@Component({
  selector: 'app-posts',
  templateUrl: './posts-table.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, TableComponent],
})
export class PostsTableComponent
  extends ControllerComponent<PostsTableService>
  implements OnInit
{
  constructor(injector: Injector, public authService: AuthService) {
    super(injector, PostsTableService);
  }

  ngOnInit(): void {
    this.model.getAll((res: any) => {
      console.log(res);
    });
  }

  ngDoCheck(): void {}
}
