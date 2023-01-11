import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Params, Router} from "@angular/router";
import {ClipService} from "../../services/clip.service";
import IClip from "../../models/clip.model";
import {ModalService} from "../../services/modal.service";
import {BehaviorSubject} from "rxjs";

@Component({
  selector: 'app-manage',
  templateUrl: './manage.component.html',
  styleUrls: ['./manage.component.css']
})
export class ManageComponent implements OnInit {

  videoOrder = '1'
  clips: IClip[] = []
  activeClip: IClip | null = null
  sort$: BehaviorSubject<string>

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private clipService: ClipService,
    private modalService: ModalService
  ) {
    this.sort$ = new BehaviorSubject<string>(this.videoOrder)
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params: Params) => {
      this.videoOrder = params.sort === '2' ? params.sort : '1'
      this.sort$.next(this.videoOrder)
    })

    this.clipService.getUserClips(this.sort$).subscribe(docs => {
      this.clips = []

      docs.forEach(doc => {
        this.clips.push({
          docId: doc.id,
          ...doc.data()
        })
      })
    })
  }

  sort(event: Event) {
    const { value } = (event.target as HTMLSelectElement)
    //this.router.navigateByUrl(`/manage?sort=${value}`)
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        sort: value
      }
    })
  }

  openModal($event: Event, clip: IClip) {
    $event.preventDefault()
    this.activeClip = clip
    this.modalService.toggleModal("editClip")
  }

  update($event: IClip) {
    this.clips.forEach((el, index) => {
      if(el.docId == $event.docId) {
        this.clips[index].title = $event.title
      }
    })
  }

  deleteClip($event: MouseEvent, clip: IClip) {
    $event.preventDefault()

    this.clipService.deleteClip(clip)

    this.clips.forEach((el, index) => {
      if(el.docId == clip.docId) {
        this.clips.splice(index, 1)
      }
    })
  }

  async copyToClipboard($event: MouseEvent, docId: string | undefined) {
    $event.preventDefault()
    if(!docId) {
      return
    }

    const url = `${location.origin}/clip/${docId}`

    await navigator.clipboard.writeText(url)

    alert("Link Copied")
  }
}
