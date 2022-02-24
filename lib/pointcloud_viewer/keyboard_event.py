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
        return f"""KeyboardEvent(key: \"{
            self.key
        }\", code: \"{
            self.code
        }\", shiftKey: {
            self.shiftKey
        }, altKey: {
            self.altKey
        }, ctrlKey: {
            self.ctrlKey
        }, metaKey: {
            self.metaKey
        }, repeat: {
            self.repeat
        })"""
