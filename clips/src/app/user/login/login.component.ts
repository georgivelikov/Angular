import { Component } from '@angular/core';
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {AngularFireAuth} from "@angular/fire/compat/auth";
@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {

  showAlert = false
  alertMsg = "Please wait! We are logging you in."
  alertColor = "blue"
  inSubmission = false

  constructor(private auth: AngularFireAuth) {

  }
  loginForm = new FormGroup({
    email: new FormControl('',[
      Validators.required,
      Validators.email
    ]),
    password: new FormControl('',[
      Validators.required,
    ]),
  })

  async login() {
    this.showAlert = true
    this.alertMsg = "Please wait! We are logging you in."
    this.alertColor = "blue"
    this.inSubmission = true

    try {
      await this.auth.signInWithEmailAndPassword(
        this.loginForm.value.email as string, this.loginForm.value.password as string
      )
    } catch(e) {
      this.inSubmission = false
      this.alertMsg = "An unexpected error occurred. Please try again later."
      this.alertColor = "red"

      return
    }

    this.alertMsg = "Success! You are now logged in."
    this.alertColor = "green"
  }
}
