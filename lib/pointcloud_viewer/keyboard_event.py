class KeyboardEvent:
    key: str
    code: str
    shiftKey: bool
    altKey: bool
    ctrlKey: bool
    metaKey: bool
    repeat: bool

    def __init__(
        self,
        key: str,
        code: str,
        shiftKey: bool,
        altKey: bool,
        ctrlKey: bool,
        metaKey: bool,
        repeat: bool
    ) -> None:
        self.key = key
        self.code = code
        self.shiftKey = shiftKey
        self.altKey = altKey
        self.ctrlKey = ctrlKey
        self.metaKey = metaKey
        self.repeat = repeat

    def __str__(self) -> str:
        return "KeyboardEvent(key: \"%s\", code: \"%s\", shiftKey: %s, altKey: %s, ctrlKey: %s, metaKey: %s, repeat: %s)" % (
            self.key,
            self.code,
            self.shiftKey,
            self.altKey,
            self.ctrlKey,
            self.metaKey,
            self.repeat
        )
