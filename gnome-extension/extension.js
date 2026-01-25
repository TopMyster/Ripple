import St from 'gi://St';
import Clutter from 'gi://Clutter';
import GObject from 'gi://GObject';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import { Extension } from 'resource:///org/gnome/shell/extensions/extension.js';

const RippleIsland = GObject.registerClass(
    class RippleIsland extends PanelMenu.Button {
        _init() {
            super._init(0.5, 'Ripple Island', false);

            this._container = new St.Bin({
                style_class: 'ripple-island-container',
                reactive: true,
                can_focus: true,
                track_hover: true,
            });

            this._label = new St.Label({
                text: 'Ripple',
                y_align: Clutter.ActorAlign.CENTER,
                style_class: 'ripple-island-label'
            });

            this._container.set_child(this._label);
            this.add_child(this._container);

            this._container.connect('button-press-event', () => {
                this._toggleExpand();
                return Clutter.EVENT_STOP;
            });

            this._expanded = false;
        }

        _toggleExpand() {
            if (this._expanded) {
                this._container.ease({
                    width: 80,
                    duration: 250,
                    mode: Clutter.AnimationMode.EASE_OUT_QUINT,
                    onComplete: () => {
                        this._label.show();
                        this._expanded = false;
                    }
                });
            } else {
                this._label.hide();
                this._container.ease({
                    width: 200,
                    duration: 250,
                    mode: Clutter.AnimationMode.EASE_OUT_QUINT,
                    onComplete: () => {
                        this._expanded = true;
                    }
                });
            }
        }
    }
);

export default class RippleExtension extends Extension {
    enable() {
        this._indicator = new RippleIsland();
        Main.panel.addToStatusArea(this.uuid, this._indicator, 1, 'center');
    }

    disable() {
        this._indicator.destroy();
        this._indicator = null;
    }
}
