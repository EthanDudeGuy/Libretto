"""
Hardcoded seed data for the catalog (Information tab) tables, so the frontend
has real shapes to build against before the research/related-content
pipelines exist. `seed_catalog` is idempotent — it no-ops once any catalog
book exists — and is called once at server startup.

Covers three content_status states on purpose: "dune" has every narrative
section fully "ready", "dune-messiah" is mid-pipeline ("researching" with no
content yet), and "project-hail-mary" is untouched ("pending").
"""

from sqlalchemy.orm import Session

import db_models


def seed_catalog(db: Session) -> None:
    if db.query(db_models.CatalogBook).first() is not None:
        return

    herbert = db_models.CatalogAuthor(
        id="author-frank-herbert",
        name="Frank Herbert",
        bio=(
            "American science fiction author (1920–1986), best known for the Dune "
            "saga, which he began writing after researching sand dune stabilization "
            "programs on the Oregon coast."
        ),
    )
    weir = db_models.CatalogAuthor(
        id="author-andy-weir",
        name="Andy Weir",
        bio=(
            "American novelist known for hard-science-fiction novels including "
            "The Martian and Project Hail Mary, blending rigorous technical detail "
            "with humor."
        ),
    )
    db.add_all([herbert, weir])

    dune_series = db_models.CatalogSeries(id="series-dune", name="Dune")
    db.add(dune_series)

    dune = db_models.CatalogBook(
        id="dune",
        title="Dune",
        author_id=herbert.id,
        series_id=dune_series.id,
        series_position=1,
        publication_date="1965-08-01",
        original_language="English",
        genres=["Science Fiction", "Political Intrigue", "Adventure"],
        content_status={
            "synopsis": "ready",
            "how_it_was_written": "ready",
            "historical_context": "ready",
            "reception_and_legacy": "ready",
        },
        synopsis={
            "summary": (
                "On the desert planet Arrakis, young Paul Atreides is thrust into a "
                "web of political betrayal, prophecy, and ecological survival after "
                "his family is granted stewardship of the only source of the "
                "universe's most valuable substance: the spice melange."
            ),
            "sources": [
                {
                    "title": "Dune (novel)",
                    "url": "https://en.wikipedia.org/wiki/Dune_(novel)",
                    "publisher": "Wikipedia",
                }
            ],
        },
        how_it_was_written={
            "summary": (
                "Herbert spent nearly six years researching and writing Dune, drawing "
                "on fieldwork studying Oregon Dunes sand-stabilization efforts, and on "
                "his readings in ecology, religion, and Middle Eastern history. The "
                "manuscript was rejected by over twenty publishers before being "
                "accepted by Chilton, better known for auto-repair manuals."
            ),
            "sources": [
                {
                    "title": "The Making of Dune",
                    "url": "https://www.tor.com/2015/08/03/the-making-of-dune/",
                    "publisher": "Tor.com",
                }
            ],
        },
        historical_context={
            "summary": (
                "Published in 1965 amid the Cold War, the environmental movement's "
                "early stirrings, and growing Western interest in Middle Eastern "
                "geopolitics and oil, Dune's ecological themes and desert-culture "
                "worldbuilding resonated with readers newly attentive to resource "
                "scarcity and empire."
            ),
            "sources": [
                {
                    "title": "Dune's Enduring Political Vision",
                    "url": "https://www.newyorker.com/culture/dune",
                    "publisher": "The New Yorker",
                }
            ],
        },
        reception_and_legacy={
            "summary": (
                "Dune won the inaugural Nebula Award for Best Novel and shared the "
                "Hugo Award, and is widely regarded as the best-selling science "
                "fiction novel of all time. It shaped decades of the genre and "
                "inspired multiple film and television adaptations."
            ),
            "sources": [
                {
                    "title": "Nebula Award for Best Novel",
                    "url": "https://en.wikipedia.org/wiki/Nebula_Award_for_Best_Novel",
                    "publisher": "Wikipedia",
                }
            ],
        },
    )

    dune_messiah = db_models.CatalogBook(
        id="dune-messiah",
        title="Dune Messiah",
        author_id=herbert.id,
        series_id=dune_series.id,
        series_position=2,
        publication_date="1969-10-01",
        original_language="English",
        genres=["Science Fiction", "Political Intrigue"],
        content_status={
            "synopsis": "ready",
            "how_it_was_written": "researching",
            "historical_context": "researching",
            "reception_and_legacy": "pending",
        },
        synopsis={
            "summary": (
                "Twelve years after becoming Emperor, Paul Atreides faces a "
                "conspiracy from the very institutions he once toppled, as the "
                "religious empire built in his name grows into a threat he can no "
                "longer control."
            ),
            "sources": [
                {
                    "title": "Dune Messiah",
                    "url": "https://en.wikipedia.org/wiki/Dune_Messiah",
                    "publisher": "Wikipedia",
                }
            ],
        },
        how_it_was_written=None,
        historical_context=None,
        reception_and_legacy=None,
    )

    project_hail_mary = db_models.CatalogBook(
        id="project-hail-mary",
        title="Project Hail Mary",
        author_id=weir.id,
        series_id=None,
        series_position=None,
        publication_date="2021-05-04",
        original_language="English",
        genres=["Science Fiction", "Hard Science Fiction", "Adventure"],
        content_status=db_models.default_content_status(),
        synopsis=None,
        how_it_was_written=None,
        historical_context=None,
        reception_and_legacy=None,
    )

    db.add_all([dune, dune_messiah, project_hail_mary])
    db.flush()

    db.add_all([
        db_models.RelatedContent(
            book_id=dune.id,
            title="Dune (2021)",
            type="adaptation_film",
            url="https://www.imdb.com/title/tt1160419/",
            description="Denis Villeneuve's film adaptation covering roughly the first half of the novel.",
            source="Warner Bros. / Legendary Pictures",
            publication_date="2021-10-22",
            thumbnail_url=None,
        ),
        db_models.RelatedContent(
            book_id=dune.id,
            title="Dune: Part Two (2024)",
            type="adaptation_film",
            url="https://www.imdb.com/title/tt15239678/",
            description="Denis Villeneuve's second film, adapting the remainder of the novel.",
            source="Warner Bros. / Legendary Pictures",
            publication_date="2024-03-01",
            thumbnail_url=None,
        ),
        db_models.RelatedContent(
            book_id=dune.id,
            title="Denis Villeneuve on Adapting the Unadaptable",
            type="interview",
            url="https://www.theguardian.com/film/dune-villeneuve-interview",
            description="Villeneuve discusses the challenges of bringing Herbert's novel to screen.",
            source="The Guardian",
            publication_date="2021-09-15",
            thumbnail_url=None,
        ),
        db_models.RelatedContent(
            book_id=dune.id,
            title="The Spice Must Flow: A History of Dune",
            type="documentary",
            url="https://www.hbomax.com/path-to-dune",
            description="A behind-the-scenes look at the novel's legacy and its journey to film.",
            source="HBO Max",
            publication_date="2021-10-01",
            thumbnail_url=None,
        ),
        db_models.RelatedContent(
            book_id=project_hail_mary.id,
            title="Project Hail Mary (upcoming film)",
            type="adaptation_film",
            url="https://www.imdb.com/title/tt11607906/",
            description="Phil Lord and Christopher Miller's film adaptation starring Ryan Gosling.",
            source="Amazon MGM Studios",
            publication_date=None,
            thumbnail_url=None,
        ),
        db_models.RelatedContent(
            book_id=project_hail_mary.id,
            title="Andy Weir on the Science of Project Hail Mary",
            type="podcast",
            url="https://www.npr.org/podcasts/project-hail-mary-science",
            description="Weir breaks down the real orbital mechanics and astrobiology behind the novel.",
            source="NPR",
            publication_date="2021-05-10",
            thumbnail_url=None,
        ),
    ])

    db.commit()
