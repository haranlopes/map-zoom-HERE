// Inicializa o mapa
var platform = new H.service.Platform({
    apikey: 'S6iKNageoCmUs62wX0567jpYEtPLA12q1l3edGbwPRw' // Substitua pela sua chave de API
});

var defaultLayers = platform.createDefaultLayers();
var map = new H.Map(
    document.getElementById('mapContainer'),
    defaultLayers.vector.normal.map,
    {
        center: { lat: -27.593982109843655, lng: -48.57184345602189 },
        zoom: 10,
        pixelRatio: window.devicePixelRatio || 1
    }
);

// Adiciona eventos ao mapa
var mapEvents = new H.mapevents.MapEvents(map);
var behavior = new H.mapevents.Behavior(mapEvents);
behavior.disable(H.mapevents.Behavior.Feature.FRACTIONAL_ZOOM);

var ui = H.ui.UI.createDefault(map, defaultLayers);
ui.removeControl("mapsettings");
ui.removeControl('zoom');
ui.addControl('zoom', new H.ui.ZoomControl({
    fractionalZoom: true,
    alignment: H.ui.LayoutAlignment.RIGHT_BOTTOM
}));

// Configura a cinética do zoom
var kinetics = {
    duration: 300, // Duração da animação em milissegundos
    power: 1.2, // Reduzido para diminuir a potência
    ease: function (progress) {
        return progress < 1
            ? progress * progress
            : -1 + (4 - 2 * progress) * progress;
    }
};

// Corrige o comportamento do zoom via scroll
map.addEventListener('wheel', function (evt) {
    evt.preventDefault(); // Previne o comportamento padrão

    let zoom = map.getZoom();
    let zoomSpeed = 0.01; // Ajuste a sensibilidade aqui

    if (evt.deltaY < 0) {
        map.setZoom(zoom + zoomSpeed, true);
    } else if (evt.deltaY > 0) {
        map.setZoom(zoom - zoomSpeed, true);
    }
});

// Controlador de Teclado
KeyboardController = function (map) {
    var doc = map.getElement().ownerDocument,
        speed = 1;
    this.map_ = map;
    this.controlKeys_ = {
        'KeyW': { change: 'rotateX', rate: -10 * speed, downAt: false },
        'KeyS': { change: 'rotateX', rate: +10 * speed, downAt: false },
        'KeyA': { change: 'rotateY', rate: -10 * speed, downAt: false },
        'KeyD': { change: 'rotateY', rate: +10 * speed, downAt: false },
        'ArrowLeft': { change: 'moveX', rate: -60 * speed, downAt: false },
        'ArrowRight': { change: 'moveX', rate: +60 * speed, downAt: false },
        'ArrowUp': { change: 'moveY', rate: -60 * speed, downAt: false },
        'ArrowDown': { change: 'moveY', rate: +60 * speed, downAt: false },
        'NumpadSubtract': { change: 'moveZ', rate: -0.5 * speed, downAt: false },
        'KeyC': { change: 'moveZ', rate: -0.5 * speed, downAt: false },
        'NumpadAdd': { change: 'moveZ', rate: +0.5 * speed, downAt: false },
        'KeyV': { change: 'moveZ', rate: +0.5 * speed, downAt: false }
    };
    this.changeRate_ = { 'rotateX': 0, 'rotateY': 0, 'rotateZ': 0, 'moveX': 0, 'moveY': 0, 'moveZ': 0 };
    this.keysDownCount_ = 0;
    this.activeKeys_ = {};
    this.keyEventHandler_ = this.keyEventHandler_.bind(this);
    doc.addEventListener('keydown', this.keyEventHandler_);
    doc.addEventListener('keyup', this.keyEventHandler_);
};

KeyboardController.prototype.dispose = function () {
    var doc = this.map_.getElement().ownerDocument;
    doc.removeEventListener('keydown', this.keyEventHandler_);
    doc.removeEventListener('keyup', this.keyEventHandler_);
    this.map_ = mapsjs.lang.NULL;
};

KeyboardController.prototype.keyEventHandler_ = function (evt) {
    var hasChanged = false,
        code = evt.code,
        key = this.controlKeys_[code],
        isKeyDown = evt.type === 'keydown',
        changeRate,
        rate,
        someKeysWereDown,
        viewModel;

    if (key && (!!key.downAt ^ isKeyDown)) {
        someKeysWereDown = this.keysDownCount_ > 0;
        key.downAt = isKeyDown ? Date.now() : 0;
        this.keysDownCount_ += isKeyDown ? +1 : -1;

        changeRate = this.changeRate_;
        rate = changeRate[key.change];
        if (rate) {
            rate = 0;
        } else {
            rate += key.rate * (isKeyDown ? +1 : -1);
        }
        this.changeRate_[key.change] = rate;
        viewModel = this.map_.getViewModel();
        if (!someKeysWereDown) {
            viewModel.startControl();
        }
        if (this.keysDownCount_) {
            viewModel.control(
                changeRate.moveX, changeRate.moveY, changeRate.moveZ,
                changeRate.rotateX, changeRate.rotateY, changeRate.rotateZ
            );
        } else {
            viewModel.endControl();
        }
    }
};

// Torna o mapa responsivo
window.addEventListener('resize', () => map.getViewPort().resize());

// Inicializa o controlador de teclado
window.onload = function () {
    var keyboardController = new KeyboardController(map);
};
