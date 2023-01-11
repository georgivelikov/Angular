import {Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges} from '@angular/core';
import {ModalService} from "../../services/modal.service";
import IClip from "../../models/clip.model";
import {FormControl, FormGroup, Validators} from "@angular/forms";
import {ClipService} from "../../services/clip.service";

@Component({
  selector: 'app-edit',
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.css']
})
export class EditComponent implements OnInit, OnDestroy, OnChanges {

  @Input() activeClip: IClip | null = null

  clipId = new FormControl("", {
    nonNullable: true
  })
  title = new FormControl("", {
    validators: [
      Validators.required,
      Validators.minLength(3)
    ],
    nonNullable: true
  })

  editForm = new FormGroup({
    title: this.title
  })

  showAlert = false
  alertColor = "blue"
  alertMsg = "Please wait! Updating clip."
  inSubmission = false
  @Output() update = new EventEmitter()

  constructor(
    private modal: ModalService,
    private clipService: ClipService
  ) {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if(!this.activeClip) {
      return
    }

    this.inSubmission = false
    this.showAlert = false
    this.clipId.setValue(this.activeClip.docId as string)
    this.title.setValue(this.activeClip.title)
  }

  ngOnInit(): void {
    this.modal.register("editClip")
  }

  ngOnDestroy(): void {
    this.modal.unregister("editClip")
  }

  async submit() {
    if(!this.activeClip) {
      return
    }

    this.inSubmission = true
    this.showAlert = true
    this.alertColor = "blue"
    this.alertMsg = "Please wait! Updating clip."

    try {
      await this.clipService.updateClip(this.clipId.value, this.title.value)
    } catch(e) {
      this.inSubmission = false
      this.alertColor = "red"
      this.alertMsg = "Something went wrong. Try again later."
      return
    }

    this.activeClip.title = this.title.value
    this.update.emit(this.activeClip)

    this.inSubmission = false
    this.alertColor = "green"
    this.alertMsg = "Success!"
  }
}
