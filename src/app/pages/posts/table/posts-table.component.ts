import { Component, Injector, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { TableComponent } from '../../../components/table/table.component';
import { ControllerComponent } from '../../../core/base/controller';
import { AuthService } from '../../../core/services/auth/auth.service';
import { IPosts } from '../posts.types';
import { PostsTableService } from './posts-table.service';

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
    this.model.getAll((posts: IPosts[]) => {
      console.log(posts);
    });
  }

  ngDoCheck(): void {}
}
