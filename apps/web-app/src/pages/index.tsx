import { Box, Button, Divider, Heading, HStack, Link, ListItem, OrderedList, Text } from "@chakra-ui/react"
import { Identity } from "@semaphore-protocol/identity"
import { useRouter } from "next/router"
import { useCallback, useContext, useEffect, useState } from "react"
import Stepper from "../components/Stepper"
import LogsContext from "../context/LogsContext"
import IconAddCircleFill from "../icons/IconAddCircleFill"
import IconRefreshLine from "../icons/IconRefreshLine"


export default function IdentitiesPage() {
    const router = useRouter()
    const { setLogs } = useContext(LogsContext)
    const [_identity, setIdentity] = useState<Identity>()
    const [_tmpT, settmpT] = useState<string>("")
    const [_tmpN, settmpN] = useState<string>("")
    const [_tmpC, settmpC] = useState<string>("")

    useEffect(() => {
        const identityString = localStorage.getItem("identity")

        if (identityString) {
            const identity = new Identity(identityString)

            setIdentity(identity)

            setLogs("Your Semaphore identity was retrieved from the browser cache 👌🏽")
        } else {
            setLogs("Create your Semaphore identity 👆🏽")
        }
    }, [])

    const createIdentity = useCallback(async () => {
        const identity = new Identity()

        setIdentity(identity)

        localStorage.setItem("identity", identity.toString())

        setLogs("Your new Semaphore identity was just created 🎉")
    }, [])

    const userLogin = useCallback(async () => {
        const identity = new Identity()

        setIdentity(identity)

        localStorage.setItem("identity", identity.toString())

        setLogs("Your new Semaphore identity was just created 🎉")
    }, [])

    return (
        <>
            <Heading as="h2" size="xl">
                Committee Members(Identities)
            </Heading>

            <Text pt="2" fontSize="md">
                Please input your Identity information:
            </Text>
            <OrderedList pl="20px" pt="5px" spacing="3">
                <ListItem>Trapdoor: private, known only by user</ListItem>
                <ListItem>Nullifier: private, known only by user</ListItem>
                <ListItem>Commitment: public</ListItem>
            </OrderedList>

            <Divider pt="5" borderColor="gray.500" />

            <HStack pt="5" justify="space-between">
                <Text fontWeight="bold" fontSize="lg">
                    Identity
                </Text>
                {_identity && (
                    <Button leftIcon={<IconRefreshLine />} variant="link" color="text.700" onClick={createIdentity}>
                        New
                    </Button>
                )}
            </HStack>

            {_identity ? (
                <Box py="6" whiteSpace="nowrap">
                    Enter your Trapdoor
                    <Box p="5" borderWidth={1} borderColor="gray.500" borderRadius="4px">
                        <form>
                            <input
                                type="text"
                                value={_identity.trapdoor.toString()}
                                onChange={(e) => settmpT(e.target.value)}
                            />
                        </form>
                    </Box>
                    Enter your Nullifier
                    <Box p="5" borderWidth={1} borderColor="gray.500" borderRadius="4px">
                        <form>
                            <input
                                type="text"
                                value={_identity.trapdoor.toString()}
                                onChange={(e) => settmpN(e.target.value)}
                            />
                        </form>
                    </Box>
                    Enter your Commitment
                    <Box p="5" borderWidth={1} borderColor="gray.500" borderRadius="4px">
                        <form>
                            <input
                                type="text"
                                value={_identity.commitment.toString()}
                                onChange={(e) => settmpC(e.target.value)}
                            />
                        </form>
                    </Box>
                </Box>
            ) : (
                <Box py="6">
                    <Button
                        w="100%"
                        fontWeight="bold"
                        justifyContent="left"
                        colorScheme="primary"
                        px="4"
                        onClick={createIdentity}
                        leftIcon={<IconAddCircleFill />}
                    >
                        Log In 👈🏻
                    </Button>
                </Box>
            )}

            <Divider pt="3" borderColor="gray" />

            <Stepper step={1} onNextClick={_identity && (() => router.push("/groups"))} />
        </>
    )
}
