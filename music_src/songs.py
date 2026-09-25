"""Imports every song module so they register with mfw.SONGS."""
from mfw import SONGS, make
import s_field  # noqa: F401
import s_battle  # noqa: F401
import s_story  # noqa: F401
import s_towns  # noqa: F401
import s_interior  # noqa: F401
import s_jingles  # noqa: F401
import os as _os
if _os.environ.get('SOLMERE_AUDITION'):
    import s_audition  # noqa: F401
    import s_audition2  # noqa: F401
