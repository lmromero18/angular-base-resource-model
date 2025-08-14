import { Component, Injector, OnInit } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { ControllerComponent } from '../../../core/base/controller';
import { AuthService } from '../../../core/services/auth/auth.service';
import { PostsTableService } from './posts-form.service';
import { FormComponent } from '../../../components/form/form.component';

@Component({
  selector: 'app-posts',
  templateUrl: './posts-form.component.html',
  standalone: true,
  imports: [ReactiveFormsModule, FormComponent],
})
export class PostsFormComponent
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
